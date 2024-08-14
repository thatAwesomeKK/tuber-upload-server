import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export default function (
  thumbnailDir: string,
  inputFile: string,
  filename: string
) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .screenshots({
        timestamps: ["50%"],
        folder: thumbnailDir,
        filename: `${filename}.jpg`,
        size: "1280x720",
      })
      .on("end", function () {
        console.log("Thumbnail Saved!");
        resolve("");
      })
      .on("error", function (err) {
        console.log(err);
        reject("");
      });
  });
}
