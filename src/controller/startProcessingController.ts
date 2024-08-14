import { Request, Response } from "express";
import fs from "fs";
import createThumbnail from "../helper/createThumbnail";
import { uploadToGridFS } from "../config/multerStorage";
import cloudinary from "../config/cloudinary";
import axios from "axios";
import env from "../helper/env";
import { Worker } from "worker_threads";
import path from "path";

const queue: any[] = [];
let inProcess = false;

export default async function (req: Request, res: Response) {
  try {
    const { originalname, expiresAt } = req.body;
    const fileName = `${originalname}_temp.mp4`;

    queue.push({ file: fileName, expiresAt });
    if (queue.length > 0 && inProcess == false) processVideo();

    res.status(200).json({
      message: "Video Being Processed!",
      fileName: `${originalname}_master.m3u8`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
}

const Resolution = [
  { resolution: "426x240", bitrate: "500k", name: "240p" },
  { resolution: "640x360", bitrate: "800k", name: "360p" },
  { resolution: "854x480", bitrate: "1200k", name: "480p" },
  // { resolution: "1280x720", bitrate: "2500k", name: "720p" },
];

const processVideo = async () => {
  try {
    const { file, expiresAt } = queue.shift();
    inProcess = true;
    console.log("Processing video...", file);

    const inputFile = `./public/input/${file}`;
    const outputDirName = (file as string).split("_")[0];

    const outputDir = `./public/output`;

    const fileName = outputDirName;
    const thumbnailDir = "./public/thumbnails";
    if (!fs.existsSync(thumbnailDir))
      fs.mkdirSync(thumbnailDir, { recursive: true });
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const data = Resolution.map(async (reso) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker("./src/worker.js", {
          workerData: {
            inputFile,
            fileName,
            outputDir,
            reso,
          },
        });
        worker.on("message", (message) => {
          console.log(message);
          resolve(message);
        });
        worker.on("error", (error) => {
          console.log(error);
          reject(error);
        });
      });
    });
    await createThumbnail(thumbnailDir, inputFile, fileName);
    const thumbnail = await cloudinary.uploader.upload(
      `${thumbnailDir}/${fileName}.jpg`,
      {
        upload_preset: "vmbhsyoa",
      }
    );
    const thumbnailRes = await axios.post(
      `${env.METADATA_SERVER_URL}/api/hook/published-thumbnail`,
      { filename: `${fileName}_master.m3u8`, thumbnail: thumbnail.secure_url }
    );
    console.log("Metadata sent to metadata server:", thumbnailRes.data);

    await Promise.all(data);

    // Create master playlist
    createMasterPlaylist(
      outputDir,
      path.join(outputDir, `${fileName}_master.m3u8`)
    );

    fs.readdirSync(outputDir).forEach(async (file) => {
      await uploadToGridFS(path.join(outputDir, file), file, expiresAt);
    });

    // await Promise.all([masterPlaylistUpload, createQualityFiles]);
    console.log("Files uploaded to GridFS.");

    // Send metadata to metadata server as a webhook
    const response = await axios.post(
      `${env.METADATA_SERVER_URL}/api/hook/published-video`,
      { filename: `${fileName}_master.m3u8`, thumbnail: thumbnail.secure_url }
    );

    console.log("Metadata sent to metadata server:", response.data);

    inProcess = false; //Set inProcess to false

    await fs.promises.unlink(`${thumbnailDir}/${fileName}.jpg`);
    await fs.promises.unlink(inputFile);
    // fs.rmSync(outputDir, { recursive: true });
    // await fs.promises.rm(outputDir, { recursive: true });
    // rimraf.nativeSync(outputDir + "/", { maxRetries: 5, retryDelay: 2000 });

    //Start processing next video
    if (queue.length > 0) processVideo();
    else if (queue.length <= 0) return;
  } catch (error) {
    console.log(error);
    return;
  }
};

const createMasterPlaylist = (inputDir: string, outputFile: string) => {
  // Read all .m3u8 files from the input directory
  const files = fs
    .readdirSync(inputDir)
    .filter((file) => file.endsWith(".m3u8") && file !== "master.m3u8");

  // Create master playlist content
  const masterPlaylistContent = files
    .map((file) => {
      // Extract bitrate and resolution from the filename
      const [name] = file.split(".m3u8");
      const resolution = name.split("_");

      const resolutions = Resolution.find((res) => res.name === resolution[1]);
      const bitrate = resolutions?.bitrate;
      const reso = resolutions?.resolution;
      return `#EXT-X-STREAM-INF:BANDWIDTH=${
        parseInt(bitrate!) * 1000
      },RESOLUTION=${reso}\n${file}`;
    })
    .join("\n");

  // Write master playlist file
  fs.writeFileSync(outputFile, `#EXTM3U\n${masterPlaylistContent}`, "utf8");
  console.log("Master playlist created successfully.");
};
