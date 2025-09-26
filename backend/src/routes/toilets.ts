// 화장실 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 모든 화장실 목록 가져오기
router.get('/', async (req, res) => {
  try {
    console.log('🚽 화장실 목록 요청을 받았습니다!');

    const toilets = await prisma.toilet.findMany({
      where: {
        isActive: true, // 활성화된 화장실만
      },
      include: {
        ratings: true, // 별점 정보도 함께 가져오기
        creator: {
          select: {
            name: true, // 생성자의 이름만 가져오기
          }
        }
      },
      orderBy: {
        createdAt: 'desc', // 최신순으로 정렬
      }
    });

    // 평균 별점 계산하여 응답 데이터 가공
    const toiletsWithRating = toilets.map(toilet => ({
      id: toilet.id,
      name: toilet.name,
      address: toilet.address,
      lat: toilet.latitude,
      lng: toilet.longitude,
      type: toilet.type,
      hasPassword: toilet.hasPassword,
      passwordHint: toilet.passwordHint,
      rating: toilet.ratings.length > 0
        ? toilet.ratings.reduce((sum, r) => sum + r.rating, 0) / toilet.ratings.length
        : null,
      ratingCount: toilet.ratings.length,
      creatorName: toilet.creator?.name,
      createdAt: toilet.createdAt,
    }));

    console.log(`📊 ${toiletsWithRating.length}개의 화장실 데이터를 반환합니다.`);

    res.json({
      success: true,
      count: toiletsWithRating.length,
      data: toiletsWithRating
    });

  } catch (error) {
    console.error('❌ 화장실 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 목록을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 특정 화장실 상세 정보 가져오기
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 화장실 상세 정보 요청: ID ${id}`);

    const toilet = await prisma.toilet.findUnique({
      where: { id },
      include: {
        ratings: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        creator: {
          select: { name: true }
        }
      }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    // 평균 별점 계산
    const averageRating = toilet.ratings.length > 0
      ? toilet.ratings.reduce((sum, r) => sum + r.rating, 0) / toilet.ratings.length
      : null;

    const response = {
      id: toilet.id,
      name: toilet.name,
      address: toilet.address,
      lat: toilet.latitude,
      lng: toilet.longitude,
      type: toilet.type,
      hasPassword: toilet.hasPassword,
      passwordHint: toilet.passwordHint,
      rating: averageRating,
      ratings: toilet.ratings.map(r => ({
        rating: r.rating,
        createdAt: r.createdAt,
        userName: r.user.name
      })),
      creatorName: toilet.creator?.name,
      createdAt: toilet.createdAt,
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ 화장실 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 정보를 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 새 화장실 등록하기
router.post('/', async (req, res) => {
  try {
    const { name, address, latitude, longitude, type, hasPassword, passwordHint, creatorId } = req.body;

    console.log('📝 새 화장실 등록 요청:', { name, address });

    // 필수 필드 검증
    if (!name || !address || !latitude || !longitude || !type) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다. (이름, 주소, 위도, 경도, 타입 필요)'
      });
    }

    // 위도, 경도 유효성 검사
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: '올바르지 않은 좌표입니다.'
      });
    }

    // 같은 좌표에 이미 화장실이 있는지 확인 (반경 50m 이내)
    const existingToilet = await prisma.toilet.findFirst({
      where: {
        AND: [
          { latitude: { gte: latitude - 0.0005 } }, // 약 50m 반경
          { latitude: { lte: latitude + 0.0005 } },
          { longitude: { gte: longitude - 0.0005 } },
          { longitude: { lte: longitude + 0.0005 } },
          { isActive: true }
        ]
      }
    });

    if (existingToilet) {
      return res.status(400).json({
        success: false,
        message: '이미 해당 위치 근처에 등록된 화장실이 있습니다.',
        existingToilet: {
          id: existingToilet.id,
          name: existingToilet.name,
          address: existingToilet.address
        }
      });
    }

    // 새 화장실 생성
    const newToilet = await prisma.toilet.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        type,
        hasPassword: hasPassword || false,
        passwordHint: passwordHint?.trim() || null,
        creatorId: creatorId || null,
      },
      include: {
        creator: {
          select: { name: true }
        }
      }
    });

    console.log('✅ 새 화장실 생성 완료:', newToilet.name);

    res.status(201).json({
      success: true,
      message: '화장실이 성공적으로 등록되었습니다!',
      data: {
        id: newToilet.id,
        name: newToilet.name,
        address: newToilet.address,
        lat: newToilet.latitude,
        lng: newToilet.longitude,
        type: newToilet.type,
        hasPassword: newToilet.hasPassword,
        passwordHint: newToilet.passwordHint,
        creatorName: newToilet.creator?.name,
        createdAt: newToilet.createdAt,
      }
    });

  } catch (error) {
    console.error('❌ 화장실 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 등록 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 화장실 정보 수정하기 (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, hasPassword, passwordHint } = req.body;

    console.log(`🔧 화장실 수정 요청: ID ${id}`);

    // 화장실 존재 여부 확인
    const existingToilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!existingToilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    // 수정할 데이터만 골라내기
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (address) updateData.address = address.trim();
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude.toString());
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude.toString());
    if (hasPassword !== undefined) updateData.hasPassword = hasPassword;
    if (passwordHint !== undefined) updateData.passwordHint = passwordHint?.trim() || null;

    const updatedToilet = await prisma.toilet.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { name: true }
        }
      }
    });

    console.log('✅ 화장실 수정 완료:', updatedToilet.name);

    res.json({
      success: true,
      message: '화장실 정보가 성공적으로 수정되었습니다!',
      data: {
        id: updatedToilet.id,
        name: updatedToilet.name,
        address: updatedToilet.address,
        lat: updatedToilet.latitude,
        lng: updatedToilet.longitude,
        type: updatedToilet.type,
        hasPassword: updatedToilet.hasPassword,
        passwordHint: updatedToilet.passwordHint,
        creatorName: updatedToilet.creator?.name,
        updatedAt: updatedToilet.updatedAt,
      }
    });

  } catch (error) {
    console.error('❌ 화장실 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 수정 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 화장실 삭제하기 (논리적 삭제)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ 화장실 삭제 요청: ID ${id}`);

    // 화장실 존재 여부 확인
    const existingToilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!existingToilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    // 논리적 삭제 (isActive = false로 설정)
    await prisma.toilet.update({
      where: { id },
      data: { isActive: false }
    });

    console.log('✅ 화장실 삭제 완료:', existingToilet.name);

    res.json({
      success: true,
      message: '화장실이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 화장실 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 삭제 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;