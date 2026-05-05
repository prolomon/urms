import express from "express";
import {
  createStaff,
  getStaffs,
  getStaffsByCenter,
  getStaff,
  updateStaff,
  deleteStaff,
  resetPassword,
  changePassword,
} from "../controller/staffController.js";

const router = express.Router();

router.post("/", createStaff);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", changePassword);
router.get("/", getStaffs);
router.get("/center/:center", getStaffsByCenter);
router.get("/:uid", getStaff);
router.put("/:uid", updateStaff);
router.delete("/:uid", deleteStaff);

export { router as staffRouter };