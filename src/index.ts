import express from "express";
import videoRouter from "./routes/video";
import { connectToMongo } from "./config/db";
import morgan from "morgan";

const PORT = process.env.PORT || 5001;
const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/video", videoRouter);

connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
  });
});
