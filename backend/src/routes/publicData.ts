// 공공데이터 동기화 관련 API 라우트
import { Router } from 'express';
import publicDataService from '../services/publicDataService';

const router = Router();

// 수동으로 서울교통공사 화장실 데이터 동기화
router.post('/sync/subway-toilets', async (req, res) => {
  try {
    console.log('🚇 서울교통공사 화장실 데이터 수동 동기화 요청');

    const result = await publicDataService.saveSubwayToiletsToDatabase();

    if (result.success) {
      res.json({
        success: true,
        message: '서울교통공사 화장실 데이터 동기화가 완료되었습니다.',
        data: {
          saved: result.saved,
          errors: result.errors,
          total: result.saved + result.errors
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '서울교통공사 화장실 데이터 동기화 중 오류가 발생했습니다.',
        data: {
          saved: result.saved,
          errors: result.errors
        }
      });
    }

  } catch (error) {
    console.error('❌ 서울교통공사 화장실 동기화 라우트 오류:', error);
    res.status(500).json({
      success: false,
      message: '서울교통공사 화장실 데이터 동기화 중 서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 모든 공공데이터 동기화
router.post('/sync/all', async (req, res) => {
  try {
    console.log('🔄 모든 공공데이터 수동 동기화 요청');

    const result = await publicDataService.syncAllPublicData();

    res.json({
      success: result.success,
      message: result.success
        ? '모든 공공데이터 동기화가 완료되었습니다.'
        : '일부 공공데이터 동기화에서 오류가 발생했습니다.',
      data: {
        sources: result.results,
        summary: {
          totalSaved: result.results.reduce((sum, r) => sum + r.saved, 0),
          totalErrors: result.results.reduce((sum, r) => sum + r.errors, 0),
          sourcesProcessed: result.results.length
        }
      }
    });

  } catch (error) {
    console.error('❌ 모든 공공데이터 동기화 라우트 오류:', error);
    res.status(500).json({
      success: false,
      message: '공공데이터 동기화 중 서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 공공데이터 동기화 상태 확인
router.get('/sync/status', async (req, res) => {
  try {
    // 데이터베이스에서 공공데이터로 등록된 화장실 통계 조회
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const publicToilets = await prisma.toilet.findMany({
      where: { type: 'public' },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const userToilets = await prisma.toilet.findMany({
      where: { type: 'user' },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        publicToilets: {
          count: publicToilets.length,
          latest: publicToilets.slice(0, 5).map(t => ({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt
          }))
        },
        userToilets: {
          count: userToilets.length
        },
        lastSyncAttempt: publicToilets.length > 0
          ? publicToilets[0].createdAt
          : null
      }
    });

  } catch (error) {
    console.error('❌ 공공데이터 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '공공데이터 상태 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 특정 주소의 좌표 변환 테스트 (개발용)
router.post('/test/geocoding', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: '주소가 필요합니다.'
      });
    }

    const coordinates = await publicDataService.getCoordinatesFromAddress(address);

    if (coordinates) {
      res.json({
        success: true,
        message: '주소를 좌표로 변환했습니다.',
        data: {
          address,
          coordinates
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: '해당 주소의 좌표를 찾을 수 없습니다.'
      });
    }

  } catch (error) {
    console.error('❌ 좌표 변환 테스트 오류:', error);
    res.status(500).json({
      success: false,
      message: '좌표 변환 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;