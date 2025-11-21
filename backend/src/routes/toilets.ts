// 화장실 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import publicDataService from '../services/publicDataService';

const router = Router();
const prisma = new PrismaClient();

// 모든 화장실 목록 가져오기 (승인된 화장실만)
router.get('/', async (req, res) => {
  try {
    console.log('🚽 화장실 목록 요청을 받았습니다!');

    const toilets = await prisma.toilet.findMany({
      where: {
        isActive: true, // 활성화된 화장실만
        status: 'approved', // 승인된 화장실만
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
      latitude: toilet.latitude,
      longitude: toilet.longitude,
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

// 통계 조회 (공공화장실 & 사용자 등록 화장실 개수)
router.get('/stats/counts', async (req, res) => {
  try {
    console.log('📊 화장실 통계 요청');

    // 승인된 사용자 등록 화장실 개수
    const userToiletCount = await prisma.toilet.count({
      where: {
        type: 'user',
        status: 'approved',
        isActive: true
      }
    });

    // 공공 화장실 개수 (서울교통공사 API에서 실시간으로 가져오기)
    let publicToiletCount = 0;
    try {
      const apiData = await publicDataService.fetchSeoulSubwayToilets();

      if (apiData?.response?.header?.resultCode === '00') {
        const toilets = apiData.response.body.items?.item || [];
        publicToiletCount = Array.isArray(toilets) ? toilets.length : (toilets ? 1 : 0);
      }
    } catch (publicApiError) {
      console.error('⚠️ 공공 화장실 API 호출 실패, 0으로 처리:', publicApiError);
    }

    console.log(`✅ 통계: 공공 ${publicToiletCount}, 사용자 ${userToiletCount}`);

    res.json({
      success: true,
      data: {
        publicToilets: publicToiletCount,
        userToilets: userToiletCount,
        total: publicToiletCount + userToiletCount
      }
    });

  } catch (error) {
    console.error('❌ 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다.',
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

// 새 화장실 등록하기 (승인 대기 상태로)
router.post('/', async (req, res) => {
  try {
    const { name, address, description, latitude, longitude, hasPassword, passwordHint, creatorId } = req.body;

    console.log('📝 새 화장실 등록 요청:', { name, address });

    // 필수 필드 검증
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다. (이름, 주소 필요)'
      });
    }

    // 위도, 경도 유효성 검사 (선택사항)
    if (latitude && (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
      return res.status(400).json({
        success: false,
        message: '올바르지 않은 좌표입니다.'
      });
    }

    // 새 화장실 생성 (승인 대기 상태로)
    const newToilet = await prisma.toilet.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        description: description?.trim() || null,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null,
        type: 'user', // 사용자 등록은 항상 user 타입
        hasPassword: hasPassword || false,
        passwordHint: passwordHint?.trim() || null,
        status: 'pending', // 승인 대기 상태
        creatorId: creatorId || null,
      },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    });

    console.log('✅ 새 화장실 등록 요청 완료 (승인 대기):', newToilet.name);

    res.status(201).json({
      success: true,
      message: '화장실 등록 요청이 제출되었습니다. 관리자 승인 후 지도에 표시됩니다.',
      data: {
        id: newToilet.id,
        name: newToilet.name,
        address: newToilet.address,
        description: newToilet.description,
        status: newToilet.status,
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

// ========== 관리자 API ==========

// 승인 대기 중인 화장실 목록 조회
router.get('/admin/pending', async (req, res) => {
  try {
    console.log('📋 승인 대기 중인 화장실 목록 요청');

    const pendingToilets = await prisma.toilet.findMany({
      where: {
        status: 'pending',
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    console.log(`📊 ${pendingToilets.length}개의 승인 대기 화장실 발견`);

    res.json({
      success: true,
      count: pendingToilets.length,
      data: pendingToilets.map(toilet => ({
        id: toilet.id,
        name: toilet.name,
        address: toilet.address,
        description: toilet.description,
        hasPassword: toilet.hasPassword,
        passwordHint: toilet.passwordHint,
        photos: toilet.images.map(img => img.url),
        createdAt: toilet.createdAt,
        submittedBy: toilet.creator?.name || '알 수 없음',
        submitterEmail: toilet.creator?.email,
      }))
    });

  } catch (error) {
    console.error('❌ 승인 대기 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '승인 대기 목록 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 화장실 승인
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body; // 관리자가 좌표를 설정할 수 있음

    console.log(`✅ 화장실 승인 요청: ID ${id}`);

    const toilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    if (toilet.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '이미 처리된 요청입니다.'
      });
    }

    // 화장실 승인
    const approvedToilet = await prisma.toilet.update({
      where: { id },
      data: {
        status: 'approved',
        latitude: latitude || toilet.latitude,
        longitude: longitude || toilet.longitude,
      }
    });

    console.log('✅ 화장실 승인 완료:', approvedToilet.name);

    res.json({
      success: true,
      message: '화장실이 승인되었습니다.',
      data: approvedToilet
    });

  } catch (error) {
    console.error('❌ 화장실 승인 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 승인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 화장실 거부
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`❌ 화장실 거부 요청: ID ${id}`);

    const toilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: '해당 화장실을 찾을 수 없습니다.'
      });
    }

    if (toilet.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '이미 처리된 요청입니다.'
      });
    }

    // 화장실 거부
    const rejectedToilet = await prisma.toilet.update({
      where: { id },
      data: {
        status: 'rejected',
      }
    });

    console.log('✅ 화장실 거부 완료:', rejectedToilet.name);

    res.json({
      success: true,
      message: '화장실 등록이 거부되었습니다.',
      data: rejectedToilet
    });

  } catch (error) {
    console.error('❌ 화장실 거부 오류:', error);
    res.status(500).json({
      success: false,
      message: '화장실 거부 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;