const { workerData, parentPort } = require("worker_threads");
const ffmpeg = require("fluent-ffmpeg");
const { path: ffmpegPath } = require("@ffmpeg-installer/ffmpeg");
const { path: ffprobePath } = require("@ffprobe-installer/ffprobe");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { inputFile, fileName, outputDir, reso } = workerData;

console.log("Worker Data: ", workerData);

const outputFileName = outputDir + `/${fileName}_${reso.name}.m3u8`;
const outputSegments = outputDir + `/${fileName}_${reso.name}_%03d.ts`;
console.log("Input File: ", inputFile);
console.log("Output File Name: ", outputFileName);

const [width, height] = reso.resolution.split("x");

ffmpeg(inputFile)
  .outputOptions([
    "-vf",
    `scale=${width}:${height},crop=${width}:${height}`,
    "-hls_time 10",
    "-hls_list_size 0",
    "-f hls",
    "-hls_playlist_type vod",
    "-hls_segment_filename",
    outputSegments,
  ])
  .output(outputFileName)
  .videoCodec("libx264")
  .size(reso.resolution)
  .aspect("16:9")
  .videoBitrate(reso.bitrate)
  .on("end", function () {
    console.log("Video transcoding complete!" + " " + `${reso.name}`);
    parentPort.postMessage({ resolution: reso.name });
  })
  .on("error", function (err) {
    console.log("Error: ", err);
    parentPort.postMessage({ resolution: reso.name, error: err });
  })
  .run();
