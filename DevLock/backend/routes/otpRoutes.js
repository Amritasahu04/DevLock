import express from "express";
import { receiveOTP, getOTP, getOTPs } from "../controllers/otpController.js";

const router = express.Router();

router.post("/receive", receiveOTP);
router.get("/", getOTPs); // Get all OTPs for a user: /api/otp?userId=...
router.get("/:aliasId", getOTP); // Get OTPs for specific alias: /api/otp/:aliasId?userId=...

export default router;


