// 수정 요청 관련 API 라우트
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 새 수정 요청 제출하기
router.post('/toilets/:toiletId/edit-requests', async (req, res) => {
  try {
    const { toiletId } = req.params;
    const { userId, reason, description } = req.body;

    console.log(`📝 수정 요청 제출: 화장실 ID ${toiletId}`);

    // 필수 필드 검증
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID와 수정 사유가 필요합니다.'
      });
    }

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

    // 같은 사용자가 같은 화장실에 대해 이미 대기중인 수정 요청이 있는지 확인
    const existingRequest = await prisma.editRequest.findFirst({
      where: {
        userId,
        toiletId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: '해당 화장실에 대한 수정 요청이 이미 처리 대기 중입니다.',
        existingRequest: {
          id: existingRequest.id,
          reason: existingRequest.reason,
          createdAt: existingRequest.createdAt
        }
      });
    }

    // 새 수정 요청 생성
    const newEditRequest = await prisma.editRequest.create({
      data: {
        userId,
        toiletId,
        reason,
        description: description?.trim() || null,
        status: 'pending'
      },
      include: {
        user: {
          select: { name: true }
        },
        toilet: {
          select: { name: true, address: true }
        }
      }
    });

    console.log('✅ 수정 요청 생성 완료:', newEditRequest.reason);

    res.status(201).json({
      success: true,
      message: '수정 요청이 성공적으로 제출되었습니다!',
      data: {
        id: newEditRequest.id,
        reason: newEditRequest.reason,
        description: newEditRequest.description,
        status: newEditRequest.status,
        userName: newEditRequest.user.name,
        toiletName: newEditRequest.toilet.name,
        toiletAddress: newEditRequest.toilet.address,
        createdAt: newEditRequest.createdAt
      }
    });

  } catch (error) {
    console.error('❌ 수정 요청 제출 오류:', error);
    res.status(500).json({
      success: false,
      message: '수정 요청 제출 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 특정 화장실의 모든 수정 요청 조회하기
router.get('/toilets/:toiletId/edit-requests', async (req, res) => {
  try {
    const { toiletId } = req.params;
    const { status } = req.query;

    console.log(`📋 수정 요청 목록 조회: 화장실 ID ${toiletId}`);

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

    // 쿼리 조건 생성
    const whereCondition: any = { toiletId };
    if (status && typeof status === 'string') {
      whereCondition.status = status;
    }

    // 수정 요청 목록 조회
    const editRequests = await prisma.editRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 상태별 통계
    const stats = {
      total: editRequests.length,
      pending: editRequests.filter(r => r.status === 'pending').length,
      approved: editRequests.filter(r => r.status === 'approved').length,
      rejected: editRequests.filter(r => r.status === 'rejected').length,
    };

    res.json({
      success: true,
      data: {
        toiletName: toilet.name,
        stats,
        editRequests: editRequests.map(r => ({
          id: r.id,
          reason: r.reason,
          description: r.description,
          status: r.status,
          adminResponse: r.adminResponse,
          userName: r.user.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ 수정 요청 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '수정 요청 목록을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 관리자: 모든 수정 요청 조회하기
router.get('/admin/edit-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    console.log('👑 관리자: 모든 수정 요청 조회');

    // 쿼리 조건 생성
    const whereCondition: any = {};
    if (status && typeof status === 'string') {
      whereCondition.status = status;
    }

    // 페이지네이션 계산
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 전체 개수 조회
    const totalCount = await prisma.editRequest.count({
      where: whereCondition
    });

    // 수정 요청 목록 조회
    const editRequests = await prisma.editRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: { name: true, email: true }
        },
        toilet: {
          select: { name: true, address: true, type: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    });

    // 전체 통계
    const allStats = await prisma.editRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const stats = {
      total: totalCount,
      pending: allStats.find(s => s.status === 'pending')?._count.status || 0,
      approved: allStats.find(s => s.status === 'approved')?._count.status || 0,
      rejected: allStats.find(s => s.status === 'rejected')?._count.status || 0,
    };

    res.json({
      success: true,
      data: {
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        },
        editRequests: editRequests.map(r => ({
          id: r.id,
          reason: r.reason,
          description: r.description,
          status: r.status,
          adminResponse: r.adminResponse,
          user: {
            name: r.user.name,
            email: r.user.email
          },
          toilet: {
            name: r.toilet.name,
            address: r.toilet.address,
            type: r.toilet.type
          },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ 관리자 수정 요청 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '수정 요청을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 관리자: 수정 요청 승인/거부하기
router.put('/admin/edit-requests/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminResponse } = req.body;

    console.log(`👑 관리자: 수정 요청 처리 - ID ${requestId}, 상태: ${status}`);

    // 필수 필드 검증
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '상태는 "approved" 또는 "rejected"여야 합니다.'
      });
    }

    // 수정 요청 존재 여부 확인
    const existingRequest = await prisma.editRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { name: true }
        },
        toilet: {
          select: { name: true }
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: '해당 수정 요청을 찾을 수 없습니다.'
      });
    }

    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '이미 처리된 수정 요청입니다.',
        currentStatus: existingRequest.status
      });
    }

    // 수정 요청 상태 업데이트
    const updatedRequest = await prisma.editRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminResponse: adminResponse?.trim() || null,
        updatedAt: new Date()
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

    console.log(`✅ 수정 요청 ${status === 'approved' ? '승인' : '거부'} 완료`);

    res.json({
      success: true,
      message: `수정 요청이 성공적으로 ${status === 'approved' ? '승인' : '거부'}되었습니다!`,
      data: {
        id: updatedRequest.id,
        reason: updatedRequest.reason,
        status: updatedRequest.status,
        adminResponse: updatedRequest.adminResponse,
        userName: updatedRequest.user.name,
        toiletName: updatedRequest.toilet.name,
        updatedAt: updatedRequest.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ 수정 요청 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '수정 요청 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

// 사용자: 자신의 수정 요청 목록 조회하기
router.get('/users/:userId/edit-requests', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    console.log(`👤 사용자 수정 요청 목록 조회: 사용자 ID ${userId}`);

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

    // 쿼리 조건 생성
    const whereCondition: any = { userId };
    if (status && typeof status === 'string') {
      whereCondition.status = status;
    }

    // 수정 요청 목록 조회
    const editRequests = await prisma.editRequest.findMany({
      where: whereCondition,
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

    // 상태별 통계
    const stats = {
      total: editRequests.length,
      pending: editRequests.filter(r => r.status === 'pending').length,
      approved: editRequests.filter(r => r.status === 'approved').length,
      rejected: editRequests.filter(r => r.status === 'rejected').length,
    };

    res.json({
      success: true,
      data: {
        userName: user.name,
        stats,
        editRequests: editRequests.map(r => ({
          id: r.id,
          reason: r.reason,
          description: r.description,
          status: r.status,
          adminResponse: r.adminResponse,
          toilet: {
            name: r.toilet.name,
            address: r.toilet.address,
            type: r.toilet.type
          },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ 사용자 수정 요청 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '수정 요청을 가져오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;