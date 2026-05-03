import express from "express";
import {
  createStaff,
  getStaffs,
  getStaff,
  updateStaff,
  deleteStaff,
} from "../controller/staffController.js";

const router = express.Router();

router.post("/", createStaff);
router.get("/", getStaffs);
router.get("/:uid", getStaff);
router.put("/:uid", updateStaff);
router.delete("/:uid", deleteStaff);

export { router as staffRouter };