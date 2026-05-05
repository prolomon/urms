import express from "express";
import {
  createCompany,
  getCompanies,
  getCompaniesByCenter,
  getCompany,
  updateCompany,
  deleteCompany,
  resetPassword,
  loginCompany,
  changePassword,
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  verifySecurityCode
} from "../controller/companyController.js";

const router = express.Router();

router.post("/", createCompany);
router.post("/:uid/security-token", createSecurityToken);
router.post("/:uid/forgot-security-token", forgotSecurityToken);
router.post("/:uid/change-security-token", changeSecurityToken);
router.post("/:uid/verify-security-code", verifySecurityCode);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", changePassword);
router.get("/", getCompanies);
router.get("/center/:center", getCompaniesByCenter);
router.get("/:uid", getCompany);
router.post("/login", loginCompany);
router.put("/:uid", updateCompany);
router.delete("/:uid", deleteCompany);

export { router as companyRouter };