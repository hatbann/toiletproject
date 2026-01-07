// src/routes/debug.ts (아무 파일이나 OK)
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();
router.get("/db-check", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`select 1 as ok`;
    res.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

export default router;
