// 공공 화장실 API 라우트 (DB에 저장하지 않고 실시간으로 가져오기)
import { Router } from 'express';
import publicDataService from '../services/publicDataService';
import { seoulMetroStations } from '../data/seoulMetroStations';
import axios from 'axios';

const router = Router();

// 네이버 주소 검색 API (CORS 우회용)
router.get('/search-address', async (req, res) => {
  try {
    const query = req.query.query as string;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: '검색어를 입력해주세요.'
      });
    }

    console.log(`🔍 주소 검색: ${query}`);

    const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
      params: {
        query: query,
        display: 10
      },
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || ''
      },
      timeout: 5000 // 5초 타임아웃
    });

    console.log(`✅ 검색 결과: ${response.data.items?.length || 0}개`);

    res.json({
      success: true,
      data: response.data.items || []
    });

  } catch (error) {
    console.error('❌ 주소 검색 실패:', error);
    res.status(500).json({
      success: false,
      message: '주소 검색 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 좌표 기반 가까운 역 찾기 (최대 3개)
router.get('/nearby-stations', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const limit = parseInt(req.query.limit as string) || 3;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: '올바른 좌표를 입력해주세요.'
      });
    }

    // 모든 역과의 거리 계산
    const stationsWithDistance = Object.entries(seoulMetroStations).map(([name, coords]) => {
      // 하버사인 공식으로 거리 계산 (km)
      const R = 6371; // 지구 반지름
      const dLat = (coords.lat - lat) * Math.PI / 180;
      const dLng = (coords.lng - lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return { name, distance, lat: coords.lat, lng: coords.lng };
    });

    // 거리순으로 정렬하고 상위 N개만 반환
    const nearestStations = stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    console.log(`📍 근처 역 찾기: (${lat}, ${lng}) -> ${nearestStations.map(s => s.name).join(', ')}`);

    res.json({
      success: true,
      stations: nearestStations
    });

  } catch (error) {
    console.error('❌ 근처 역 찾기 실패:', error);
    res.status(500).json({
      success: false,
      message: '근처 역을 찾는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 서울교통공사 화장실 데이터를 실시간으로 가져오기 (DB 저장 안함)
// 쿼리 파라미터: ?station=광화문 (선택사항)
router.get('/metro', async (req, res) => {
  try {
    const stationName = req.query.station as string | undefined;
    const searchInfo = stationName ? `역명: ${stationName}` : '전체';
    console.log(`🚇 서울교통공사 화장실 데이터 실시간 조회 시작... (${searchInfo})`);

    const apiData = await publicDataService.fetchSeoulSubwayToilets(stationName);

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
    // 좌표가 없는 경우 Geocoding 또는 역 좌표 사용
    const formattedToiletsPromises = toilets
      .filter(toilet => toilet.fcltNm && toilet.stnNm) // 필수 데이터: 시설명, 역명
      .map(async (toilet) => {
        let latitude: number;
        let longitude: number;

        // 1. API에서 좌표를 제공하는 경우 (있다면)
        if (toilet.fcLat && toilet.fcLot) {
          latitude = parseFloat(toilet.fcLat);
          longitude = parseFloat(toilet.fcLot);
        } else {
          // 2. 좌표가 없는 경우 - 역명으로 고정 좌표 사용
          const stationCoords = seoulMetroStations[toilet.stnNm!];

          if (stationCoords) {
            latitude = stationCoords.lat;
            longitude = stationCoords.lng;
          } else {
            // 역 좌표를 찾을 수 없는 경우 - Geocoding 시도
            const address = `서울 ${toilet.stnNm}역`;
            const coords = await publicDataService.getCoordinatesFromAddress(address);

            if (coords) {
              latitude = coords.lat;
              longitude = coords.lng;
              console.log(`🗺️ Geocoding 성공: ${toilet.stnNm}역 (${latitude}, ${longitude})`);
            } else {
              // Geocoding 실패시 해당 화장실은 제외
              console.warn(`⚠️ 좌표를 찾을 수 없음: ${toilet.stnNm}역`);
              return null;
            }
          }
        }

        return {
          id: `metro-${toilet.fcltNo || toilet.fcltNm}`, // 시설번호 또는 시설명으로 ID 생성
          name: toilet.fcltNm!,
          address: toilet.dtlPstn || `${toilet.stnNm}역 ${toilet.stnFlr || ''}`,
          latitude,
          longitude,
          type: 'public' as const,
          hasPassword: false,
          rating: null,
          ratingCount: 0,
          createdAt: new Date().toISOString()
        };
      });

    const formattedToiletsWithNulls = await Promise.all(formattedToiletsPromises);
    const formattedToilets = formattedToiletsWithNulls.filter(t => t !== null);

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
