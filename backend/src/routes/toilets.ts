// 화장실 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import publicDataService from '../services/publicDataService';
import { uploadMultiple } from '../middleware/upload';
import { uploadMultipleImagesToSupabase } from '../services/supabaseService';

const router = Router();
const prisma = new PrismaClient();

// 이미지 URL을 전체 URL로 변환하는 헬퍼 함수
const getFullImageUrl = (url: string | null | undefined, req: any): string => {
  if (!url) return '';
  
  // 이미 전체 URL인 경우
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 상대 경로인 경우 전체 URL로 변환
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3002';
  const baseUrl = `${protocol}://${host}`;
  
  // /uploads/로 시작하는 경우
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  }
  
  // /로 시작하는 상대 경로인 경우
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  
  // 그 외의 경우
  return `${baseUrl}/${url}`;
};

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

// 새 화장실 등록하기 (승인 대기 상태로) - 이미지 업로드 포함
router.post('/', uploadMultiple, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    // 디버깅: 요청 정보 상세 확인
    console.log('📝 새 화장실 등록 요청 받음');
    console.log('📦 req.body 전체:', JSON.stringify(req.body, null, 2));
    console.log('📦 req.body 타입:', typeof req.body);
    console.log('📦 req.body 키들:', Object.keys(req.body || {}));
    console.log('📁 파일 개수:', files?.length || 0);
    
    // req.body에서 값 추출 (안전하게)
    const name = req.body?.name;
    const address = req.body?.address;
    const description = req.body?.description;
    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;
    const hasPassword = req.body?.hasPassword;
    const passwordHint = req.body?.passwordHint;
    const creatorId = req.body?.creatorId;

    console.log('📋 파싱된 값들:', {
      name: name || '(없음)',
      address: address || '(없음)',
      nameType: typeof name,
      addressType: typeof address
    });

    // 필수 필드 검증
    const nameStr = typeof name === 'string' ? name : String(name || '');
    const addressStr = typeof address === 'string' ? address : String(address || '');
    
    if (!nameStr || !addressStr || nameStr.trim() === '' || addressStr.trim() === '') {
      console.error('❌ 필수 필드 누락:', { 
        name: nameStr || '(없음)', 
        address: addressStr || '(없음)',
        nameType: typeof name,
        addressType: typeof address
      });
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다. (이름, 주소 필요)'
      });
    }

    // 위도, 경도 유효성 검사 (선택사항)
    const latNum = latitude ? parseFloat(latitude.toString()) : null;
    const lngNum = longitude ? parseFloat(longitude.toString()) : null;
    if (latNum !== null && lngNum !== null && (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180)) {
      return res.status(400).json({
        success: false,
        message: '올바르지 않은 좌표입니다.'
      });
    }

    // 이미지 업로드 처리 (있는 경우)
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        console.log(`📤 ${files.length}개의 이미지를 Supabase Storage에 업로드 중...`);
        imageUrls = await uploadMultipleImagesToSupabase(files, 'toilets');
        console.log(`✅ 이미지 업로드 완료: ${imageUrls.length}개`);
      } catch (uploadError) {
        console.error('❌ 이미지 업로드 실패:', uploadError);
        return res.status(500).json({
          success: false,
          message: '이미지 업로드에 실패했습니다.',
          error: uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'
        });
      }
    }

    // 새 화장실 생성 (승인 대기 상태로)
    const newToilet = await prisma.toilet.create({
      data: {
        name: nameStr.trim(),
        address: addressStr.trim(),
        description: description?.trim() || null,
        latitude: latNum,
        longitude: lngNum,
        type: 'user', // 사용자 등록은 항상 user 타입
        hasPassword: hasPassword === 'true' || hasPassword === true,
        passwordHint: passwordHint?.trim() || null,
        status: 'pending', // 승인 대기 상태
        creatorId: creatorId || null,
        // 이미지들을 Image 테이블에 저장
        images: {
          create: imageUrls.map(url => ({
            url: url
          }))
        }
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        images: true
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
        photos: newToilet.images.map(img => img.url),
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
        photos: toilet.images.map(img => getFullImageUrl(img.url, req)),
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