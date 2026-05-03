import express from 'express';
const router = express.Router();
import { upload } from '../service/upload.js';

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).send(`File uploaded successfully: ${req.file.path}`);
});

export {router as uploadRouter};
