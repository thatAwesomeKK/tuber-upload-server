import express from "express";
import startProcessingController from "../controller/startProcessingController";
import uploadVideoController from "../controller/uploadVideoController";
import deleteVideoController from "../controller/deleteVideoController";
const router = express.Router();

router.post("/upload", uploadVideoController);
router.post("/start-processing", startProcessingController);
router.delete("/delete/:filename", deleteVideoController);

export default router;
