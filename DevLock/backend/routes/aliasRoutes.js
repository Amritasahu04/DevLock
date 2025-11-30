import express from "express";
import {
  createAlias,
  getAliases,
  deleteAlias,
  getAliasStats,
} from "../controllers/aliasController.js";

const router = express.Router();

router.post("/create", createAlias);
router.get("/", getAliases);
router.get("/stats", getAliasStats);
router.delete("/:id", deleteAlias);

export default router;


