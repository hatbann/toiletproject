// 별점 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 특정 화장실에 별점 등록하기
router.post('/toilets/:toiletId/ratings', async (req, res) => {
  try {
    const { toiletId } = req.params;
    const { userId, rating } = req.body;

    console.log(`⭐ 별점 등록 요청: 화장실 ID ${toiletId}, 별점 ${rating}`);

    // 필수 필드 검증
    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID와 별점이 필요합니다.'
      });
    }

    // 별점 범위 검증 (1-5점)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: '별점은 1-5점 사이의 정수여야 합니다.'
      });
    }

    // 화장실 존재 여부 확인
    const toilet = await prisma.toilet.findUnique({
      where: { id: toiletId }
    });

    if (!toilet || !toilet.isActive) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      });
    }

    // 기존 별점이 있는지 확인 (한 사용자당 화장실 하나에 별점 하나만)
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_toiletId: {
          userId,
          toiletId
        }
      }
    });

    let result;

    if (existingRating) {
      // 기존 별점 업데이트
      result = await prisma.rating.update({
        where: {
          userId_toiletId: {
            userId,
            toiletId
          }
        },
        data: { rating },
        include: {
          user: {
            select: { name: true }
          },
          toilet: {
            select: { name: true }
          }
        }
      });

      console.log('✅ 별점 업데이트 완료:', result.rating, '점');

      res.json({
        success: true,
        message: '별점이 성공적으로 수정되었습니다!',
        data: {
          id: result.id,
          rating: result.rating,
          userName: result.user.name,
          toiletName: result.toilet.name,
          createdAt: result.createdAt,
          isUpdated: true
        }
      });

    } else {
      // 새로운 별점 생성
      result = await prisma.rating.create({
        data: {
          userId,
          toiletId,
          rating
        },
        include: {
          user: {
            select: { name: true }
          },
          toilet: {
            select: { name: true }
          }
        }
      });

      console.log('✅ 새 별점 등록 완료:', result.rating, '점');

      res.status(201).json({
        success: true,
        message: '별점이 성공적으로 등록되었습니다!',
        data: {
          id: result.id,
          rating: result.rating,
          userName: result.user.name,
          toiletName: result.toilet.name,
          createdAt: result.createdAt,
          isUpdated: false
        }
      });
    }

  } catch (error) {
    console.error('❌ 별점 등록/수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '별점 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 특정 화장실의 모든 별점 조회하기
router.get('/toilets/:toiletId/ratings', async (req, res) => {
  try {
    const { toiletId } = req.params;
    console.log(`📊 별점 목록 조회: 화장실 ID ${toiletId}`);

    // 화장실 존재 여부 확인
    const toilet = await prisma.toilet.findUnique({
      where: { id: toiletId }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    // 해당 화장실의 모든 별점 조회
    const ratings = await prisma.rating.findMany({
      where: { toiletId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 평균 별점 계산
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

    // 별점 분포 계산
    const ratingDistribution = {
      1: ratings.filter(r => r.rating === 1).length,
      2: ratings.filter(r => r.rating === 2).length,
      3: ratings.filter(r => r.rating === 3).length,
      4: ratings.filter(r => r.rating === 4).length,
      5: ratings.filter(r => r.rating === 5).length,
    };

    res.json({
      success: true,
      data: {
        toiletName: toilet.name,
        totalRatings: ratings.length,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        ratingDistribution,
        ratings: ratings.map(r => ({
          id: r.id,
          rating: r.rating,
          userName: r.user.name,
          createdAt: r.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ 별점 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '별점 목록을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 특정 사용자의 모든 별점 조회하기
router.get('/users/:userId/ratings', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`👤 사용자 별점 목록 조회: 사용자 ID ${userId}`);

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      });
    }

    // 해당 사용자의 모든 별점 조회
    const ratings = await prisma.rating.findMany({
      where: { userId },
      include: {
        toilet: {
          select: {
            name: true,
            address: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        userName: user.name,
        totalRatings: ratings.length,
        averageRating: ratings.length > 0
          ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
          : null,
        ratings: ratings.map(r => ({
          id: r.id,
          rating: r.rating,
          toiletName: r.toilet.name,
          toiletAddress: r.toilet.address,
          toiletType: r.toilet.type,
          createdAt: r.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ 사용자 별점 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 별점을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 별점 삭제하기
router.delete('/:ratingId', async (req, res) => {
  try {
    const { ratingId } = req.params;
    console.log(`🗑️ 별점 삭제 요청: ID ${ratingId}`);

    // 별점 존재 여부 확인
    const existingRating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        toilet: {
          select: { name: true }
        }
      }
    });

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: '해당 별점을 찾을 수 없습니다.'
      });
    }

    // 별점 삭제
    await prisma.rating.delete({
      where: { id: ratingId }
    });

    console.log('✅ 별점 삭제 완료');

    res.json({
      success: true,
      message: '별점이 성공적으로 삭제되었습니다.',
      data: {
        toiletName: existingRating.toilet.name,
        deletedRating: existingRating.rating
      }
    });

  } catch (error) {
    console.error('❌ 별점 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '별점 삭제 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;