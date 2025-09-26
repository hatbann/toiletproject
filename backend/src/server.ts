// 백엔드 시작 파일
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import toiletsRouter from './routes/toilets';
import ratingsRouter from './routes/ratings';

// 환경변수 로드
dotenv.config();

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정 (지금은 몰라도 됩니다 - 나중에 설명할게요!)
app.use(cors()); // 프론트엔드에서 접근 허용
app.use(express.json()); // JSON 데이터 받을 수 있게 설정

// 첫 번째 API - 테스트용
app.get('/api/hello', (req, res) => {
  res.json({
    message: '안녕하세요! 백엔드가 성공적으로 작동하고 있습니다! 🎉',
    timestamp: new Date().toISOString()
  });
});

// 서버가 살아있는지 확인하는 API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '서버가 정상 작동중입니다'
  });
});

// 화장실 API 라우트 연결
app.use('/api/toilets', toiletsRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행중입니다!`);
  console.log(`📍 테스트 해보세요: http://localhost:${PORT}/api/hello`);
});