// 백엔드 시작 파일
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import toiletsRouter from "./routes/toilets";
import ratingsRouter from "./routes/ratings";
import editRequestsRouter from "./routes/editRequests";
import authRouter from "./routes/auth";
import publicDataRouter from "./routes/publicData";
import publicToiletsRouter from "./routes/public-toilets";

import debugRouter from "./routes/debug";

// 환경변수 로드
dotenv.config();

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://peeple.vercel.app",
    ],
    credentials: true,
  })
);

app.use("/debug", debugRouter);

// JSON 파싱 (multipart/form-data는 multer가 처리하므로 조건부 적용)
app.use((req, res, next) => {
  // Content-Type이 multipart/form-data가 아닌 경우에만 JSON 파싱
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// URL-encoded 파싱 (multipart/form-data는 multer가 처리)
app.use((req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    express.urlencoded({ extended: true })(req, res, next);
  } else {
    next();
  }
});

// 첫 번째 API - 테스트용
app.get("/api/hello", (req, res) => {
  res.json({
    message: "안녕하세요! 백엔드가 성공적으로 작동하고 있습니다! 🎉",
    timestamp: new Date().toISOString(),
  });
});

// 서버가 살아있는지 확인하는 API
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "서버가 정상 작동중입니다",
  });
});

// 임시 사용자 목록 조회 (테스트용)
app.get("/api/users", async (req, res) => {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

// 화장실 API 라우트 연결
app.use("/api/toilets", toiletsRouter);

// 별점 API 라우트 연결
app.use("/api/ratings", ratingsRouter);

// 수정 요청 API 라우트 연결
app.use("/api/edit-requests", editRequestsRouter);

// 사용자 인증 API 라우트 연결
app.use("/api/auth", authRouter);

// 공공데이터 동기화 API 라우트 연결
app.use("/api/public-data", publicDataRouter);

// 공공 화장실 실시간 조회 API 라우트 연결
app.use("/api/public-toilets", publicToiletsRouter);

// 서버 시작
const port = Number(PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 서버가 포트 ${port}에서 실행중입니다!`);
  console.log(`📍 테스트 해보세요: http://localhost:${port}/api/hello`);
  console.log(`📱 모바일에서 접속: http://[내_아이피]:${port}/api/hello`);
});
