import express from "express";
import { initUser } from "../controllers/initController.js";

const router = express.Router();

router.post("/init", initUser);

export default router;

