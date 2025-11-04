// 공공 화장실 API 라우트 (DB에 저장하지 않고 실시간으로 가져오기)
import { Router } from 'express';
import publicDataService from '../services/publicDataService';

const router = Router();

// 서울교통공사 화장실 데이터를 실시간으로 가져오기 (DB 저장 안함)
router.get('/metro', async (req, res) => {
  try {
    console.log('🚇 서울교통공사 화장실 데이터 실시간 조회 시작...');

    const apiData = await publicDataService.fetchSeoulSubwayToilets();

    if (!apiData || !apiData.response || apiData.response.header.resultCode !== '00') {
      console.error('❌ API 데이터를 가져올 수 없습니다.');
      return res.status(500).json({
        success: false,
        message: '서울교통공사 화장실 데이터를 가져올 수 없습니다.',
        error: apiData?.response?.header?.resultMsg || 'API 오류'
      });
    }

    const toilets = apiData.response.body.items?.item || [];

    console.log(`✅ ${toilets.length}개의 화장실 데이터 조회 성공`);

    // 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedToilets = toilets
      .filter(toilet => toilet.fcLat && toilet.fcLot && toilet.fcNm) // 필수 데이터가 있는 것만
      .map(toilet => ({
        id: `metro-${toilet.fcNm}`, // 임시 ID (DB에 없으므로)
        name: toilet.fcNm!,
        address: toilet.fcRdnmadr || toilet.fcLnmadr || `서울시 ${toilet.statnNm}역`,
        latitude: parseFloat(toilet.fcLat!),
        longitude: parseFloat(toilet.fcLot!),
        type: 'public' as const,
        hasPassword: false,
        rating: null,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      }));

    res.json({
      success: true,
      count: formattedToilets.length,
      data: formattedToilets
    });

  } catch (error) {
    console.error('❌ 서울교통공사 화장실 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '서울교통공사 화장실 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;
