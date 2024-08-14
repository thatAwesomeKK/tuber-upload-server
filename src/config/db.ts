import mongoose from "mongoose";
import env from "../helper/env";

export async function connectToMongo() {
  try {
    mongoose.set("strictQuery", false);
    const db = await mongoose.connect(env.mongoUrl, {
      ssl: true,
    });
    return db;
  } catch (error) {
    console.log(error);
  }
}
