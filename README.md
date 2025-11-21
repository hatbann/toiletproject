# 🚻 화장실 지도 앱 (Toilet Map App)

위치 기반 화장실 정보 공유 플랫폼으로, 사용자가 직접 화장실 위치를 등록하고 공유할 수 있는 웹 애플리케이션입니다.

## 📋 주요 기능

- **🗺️ 지도 기반 화장실 검색**: 네이버 지도 API를 활용한 실시간 화장실 위치 검색
- **📍 위치 기반 검색**: 현재 위치 또는 지정한 위치 주변의 화장실 정보 조회
- **➕ 화장실 등록**: 사용자가 직접 화장실 정보를 등록하고 사진 첨부 가능
- **✅ 관리자 승인 시스템**: 등록된 화장실 정보를 관리자가 검토 후 승인
- **🔐 인증 시스템**: JWT 기반 사용자 인증 및 권한 관리
- **🏢 공공 데이터 연동**: 서울시 공공 화장실 데이터 통합
- **📱 반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경 지원

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버
- **React Router** - 클라이언트 사이드 라우팅
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Shadcn/ui** - 재사용 가능한 UI 컴포넌트
- **Naver Maps API** - 지도 및 위치 서비스
- **Lucide React** - 아이콘

### Backend
- **Node.js** - 런타임 환경
- **Express** - 웹 프레임워크
- **Prisma** - ORM (Object-Relational Mapping)
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증 토큰
- **Bcrypt** - 비밀번호 암호화
- **Multer** - 파일 업로드 처리

### Deployment
- **Vercel** - 프론트엔드 배포
- **Railway** - 백엔드 및 데이터베이스 호스팅

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- PostgreSQL (로컬 개발 시)

### 설치 및 실행

#### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/toilet-map-app.git
cd toilet-map-app
```

#### 2. 프론트엔드 설정
```bash
npm install
npm run dev
```

#### 3. 백엔드 설정
```bash
cd backend
npm install

# .env 파일 생성 및 환경 변수 설정
cp .env.example .env

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 서버 실행
npm run dev
```

### 환경 변수 설정

#### 프론트엔드 (.env)
```env
VITE_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
VITE_API_URL=http://localhost:3002/api
```

#### 백엔드 (backend/.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/toilet_map
JWT_SECRET=your_jwt_secret_key
PORT=3002
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

## 📱 주요 화면

### 메인 지도
- 네이버 지도 기반 화장실 위치 표시
- 현재 위치 중심 검색
- 지도 이동 시 자동 재검색

### 화장실 등록
- 주소 검색 (네이버 로컬 API)
- 위도/경도 자동 저장
- 사진 업로드 (최대 3장)
- 비밀번호 필요 여부 및 힌트 입력

### 관리자 페이지
- 승인 대기 목록 조회
- 상세 정보 확인
- 승인/거부 처리

## 🗄️ 데이터베이스 스키마

### User (사용자)
- id, username, email, password
- isAdmin (관리자 여부)

### Toilet (화장실)
- id, name, address, latitude, longitude
- description, photos
- hasPassword, passwordHint
- isApproved (승인 상태)
- creatorId (등록자)

## 🔒 인증 및 권한

- JWT 기반 토큰 인증
- 보호된 라우트: 화장실 등록, 관리자 페이지
- 관리자 전용 기능: 승인/거부 처리

## 🌐 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 화장실
- `GET /api/toilets` - 화장실 목록 조회 (위치 기반)
- `POST /api/toilets` - 화장실 등록 (인증 필요)
- `GET /api/toilets/admin/pending` - 승인 대기 목록
- `POST /api/toilets/admin/:id/approve` - 승인
- `POST /api/toilets/admin/:id/reject` - 거부

### 공공 데이터
- `GET /api/public-toilets` - 서울시 공공 화장실 조회
- `GET /api/public-toilets/search-address` - 주소 검색

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.
