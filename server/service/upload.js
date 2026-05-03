import multer from "multer";
import path from "node:path";
import { Readable } from "node:stream";
import { Client } from "basic-ftp";

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD;
const FTP_PORT = Number.parseInt(process.env.FTP_PORT || "21", 10);
const FTP_SECURE = String(process.env.FTP_SECURE || "false").toLowerCase() === "true";
const FTP_BASE_PATH = process.env.FTP_BASE_PATH || "/";

const sanitizeFileName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");

const buildRemotePath = (file) => {
  const originalExt = path.extname(file.originalname || "").toLowerCase();
  const safeExt = originalExt || ".bin";
  const safeBaseName = sanitizeFileName(path.basename(file.originalname || "file", originalExt));
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${safeBaseName || "file"}-${uniqueSuffix}${safeExt}`;
  return path.posix.join(FTP_BASE_PATH, filename);
};

class FtpStorage {
  _handleFile(req, file, cb) {
    const chunks = [];

    file.stream.on("data", (chunk) => chunks.push(chunk));
    file.stream.on("error", (err) => cb(err));
    file.stream.on("end", async () => {
      if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
        return cb(new Error("FTP configuration missing. Set FTP_HOST, FTP_USER, and FTP_PASSWORD."));
      }

      const remotePath = buildRemotePath(file);
      const client = new Client();
      client.ftp.verbose = false;

      try {
        await client.access({
          host: FTP_HOST,
          port: FTP_PORT,
          user: FTP_USER,
          password: FTP_PASSWORD,
          secure: FTP_SECURE,
        });

        const content = Buffer.concat(chunks);
        const remoteDir = path.posix.dirname(remotePath);
        await client.ensureDir(remoteDir);
        await client.uploadFrom(Readable.from(content), remotePath);

        cb(null, {
          path: remotePath,
          size: content.length,
          filename: path.posix.basename(remotePath),
        });
      } catch (err) {
        cb(err);
      } finally {
        client.close();
      }
    });
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

const upload = multer({
  storage: new FtpStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
});

export { upload };