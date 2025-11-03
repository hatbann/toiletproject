// 사용자 인증 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log('👤 회원가입 요청:', email);

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름이 모두 필요합니다.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다.'
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 사용중인 이메일입니다.'
      });
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role: 'user'
      }
    });

    console.log('✅ 회원가입 완료:', newUser.email);

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 성공적으로 완료되었습니다!',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 로그인 요청:', email);

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호가 필요합니다.'
      });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    console.log('✅ 로그인 성공:', user.email);

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '로그인이 성공적으로 완료되었습니다!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 내 정보 조회 (토큰 인증 필요)
router.get('/me', async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // 토큰 검증
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        toilets: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            createdAt: true
          }
        },
        ratings: {
          include: {
            toilet: {
              select: {
                name: true,
                address: true
              }
            }
          }
        },
        editRequests: {
          include: {
            toilet: {
              select: {
                name: true,
                address: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    console.log('👤 내 정보 조회:', user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        stats: {
          toiletsRegistered: user.toilets.length,
          ratingsGiven: user.ratings.length,
          editRequestsSubmitted: user.editRequests.length
        },
        recentActivity: {
          toilets: user.toilets.slice(0, 5),
          ratings: user.ratings.slice(-5).map(r => ({
            rating: r.rating,
            toilet: r.toilet,
            createdAt: r.createdAt
          })),
          editRequests: user.editRequests.slice(-5).map(er => ({
            reason: er.reason,
            status: er.status,
            toilet: er.toilet,
            createdAt: er.createdAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('❌ 내 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 비밀번호 변경
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7);

    // 토큰 검증
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 필수 필드 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호가 필요합니다.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 현재 비밀번호 확인
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    // 새 비밀번호 암호화
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    console.log('✅ 비밀번호 변경 완료:', user.email);

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('❌ 비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;