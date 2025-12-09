// Multer 파일 업로드 미들웨어
import multer from 'multer';

// 메모리 스토리지 사용 (파일을 메모리에 저장하여 Supabase Storage로 전송)
const storage = multer.memoryStorage();

// 파일 필터: 이미지 파일만 허용
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 이미지 파일 타입 체크
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
};

// Multer 설정
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// 여러 이미지 업로드를 위한 미들웨어 (최대 3개)
export const uploadMultiple = upload.array('photos', 3);

