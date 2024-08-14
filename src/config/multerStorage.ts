import mongoose from "mongoose";
import fs from "fs";

const conn = mongoose.connection;
let gridFSBucket;

conn.once("open", () => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "videos",
  });
  conn.db
    .collection("videos.files")
    .createIndex({ "metadata.expiresAt": 1 }, { expireAfterSeconds: 0 });
  console.log("Connected to MongoDB and GridFSBucket initialized");
});

export async function uploadToGridFS(
  filePath: string,
  filename: string,
  expiresAt: string
) {
  console.log("Uploading file to GridFS:", filename);

  return new Promise((resolve, reject) => {
    const writestream = expiresAt
      ? gridFSBucket!.openUploadStream(filename, {
          metadata: { expiresAt },
        })
      : gridFSBucket!.openUploadStream(filename);
      
    fs.createReadStream(filePath)
      .pipe(writestream)
      .on("error", (err: any) => {
        console.error("Error uploading to GridFS:", err);
        reject(err);
      })
      .on("finish", () => {
        fs.unlinkSync(filePath);
        resolve(writestream.id.toString());
      });
  });
}
