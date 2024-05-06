import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { stderr, stdout } from "process";

const app = express();

// multer middleware
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname));
  },
});

// multer configuration
const upload = multer({ storage });

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ message: "Hello RNK" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  const lessionId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/courses/${lessionId}`;

  const hlsPath = `${outputPath}/index.m3u8`;
  console.log("hlsPath >>", hlsPath);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // ffmpeg
  // command to convert video to HLS format using ffmpeg
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

  exec(ffmpegCommand, (err, stdout, stderr) => {
    if (err) {
      console.log(`exec: Error: ${err}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    const videoURL = `http://localhost:8000/uploads/courses/${lessionId}/index.m3u8`;

    res.json({
      message: "Video converted to HLS fromat...",
      videoURL,
      lessionId,
    });
  });
});

app.listen(8000, () => {
  console.log("🏹 Server is running on PORT 8000");
});
