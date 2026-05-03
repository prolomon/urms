import express from "express";
import {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "../controller/companyController.js";

const router = express.Router();

router.post("/", createCompany);
router.get("/", getCompanies);
router.get("/:uid", getCompany);
router.put("/:uid", updateCompany);
router.delete("/:uid", deleteCompany);

export { router as companyRouter };