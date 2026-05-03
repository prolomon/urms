import express from "express";
import {
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitments,
} from "../controller/recruitmentController.js";

const router = express.Router();

router.post("/", createRecruitment);
router.get("/", getRecruitments);
router.get("/:id", getRecruitmentById);
router.delete("/:id", deleteRecruitment);

export { router as recruitmentRouter };
 