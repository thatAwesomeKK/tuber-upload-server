import { Request, Response } from "express";
import mongoose from "mongoose";

const conn = mongoose.connection;
let gridFSBucket;

conn.once("open", () => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "videos",
  });
  console.log("Connected to MongoDB and GridFSBucket initialized");
});

export default async function (req: Request, res: Response) {
  try {
    const { filename } = req.params;

    const cursor = await gridFSBucket!.find({});
    const files = new Array();
    await cursor.forEach((doc: any) => files.push(doc));

    const filterdFiles = files.filter((file: any) =>
      file.filename.includes(filename.split("_")[0])
    );

    if (filterdFiles.length <= 0) {
      return res.status(400).send("Video not found");
    }

    filterdFiles.forEach(async (file: any) => {
      await gridFSBucket!.delete(file._id);
    });

    return res
      .status(200)
      .json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
}
