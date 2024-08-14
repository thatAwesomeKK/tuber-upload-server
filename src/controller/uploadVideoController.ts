import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export default async function (req: Request, res: Response) {
  try {
    const inputDir = path.join(__dirname, "../../public/input");
    const tempPath = path.join(__dirname, "../../public/temp");

    console.log(inputDir, tempPath);

    if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

    const fileNameFromHeader = req.headers.filename as string;
    const fileName = fileNameFromHeader + "_temp.mp4";
    
    console.log("Saving file to disk...", fileName);

    const writeStream = fs.createWriteStream(`${tempPath}/${fileName}`);
    req.pipe(writeStream);

    writeStream.on("finish", async () => {
      fs.appendFile(
        `${inputDir}/${fileName}`,
        fs.readFileSync(`${tempPath}/${fileName}`),
        (err) => {
          if (err) {
            console.error("Error:", err);
            return res.status(500).send("Upload failed");
          }
          fs.unlinkSync(`${tempPath}/${fileName}`); // Remove the temporary chunk file
          return res.status(200).send("Chunk uploaded successfully");
        }
      );
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send("Internal Server Error!");
  }
}
