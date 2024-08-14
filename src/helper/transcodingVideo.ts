import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export const transcodeVideo = (
  inputFile: string,
  filename: string,
  outputDir: string,
  size: any
) => {
  return new Promise((resolve, reject) => {
    const outputFileName = `${outputDir}/${filename}_${size.name}.m3u8`;
    const outputSegments = `${outputDir}/${filename}_${size.name}_%03d.ts`;
    console.log("Input File: ", inputFile);
    console.log("Output File Name: ", outputFileName);

    const [width, height] = size.resolution.split("x");

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
      .size(size.resolution)
      .aspect("16:9")
      .videoBitrate(size.bitrate)
      .on("end", function () {
        console.log("Video transcoding complete!" + " " + `${size.name}`);
        resolve({ resolution: size });
      })
      .on("error", function (err) {
        console.log("Error: ", err);
        reject("");
      })
      .run();
  });
};
