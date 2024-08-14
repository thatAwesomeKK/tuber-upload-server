import dotenv from "dotenv";
dotenv.config();
export default {
  mongoUrl: process.env.MONGO_URL as string,
  METADATA_SERVER_URL: process.env.METADATA_SERVER_URL as string,
  CLIENT_URL: process.env.CLIENT_URL as string,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
};
