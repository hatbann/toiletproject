// API 통신을 위한 유틸리티 파일
// 현재 호스트의 IP를 사용 (모바일에서도 접근 가능)
// 프로토콜은 현재 페이지와 동일하게 사용 (HTTP/HTTPS 자동 매칭)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3002/api`;

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin?: boolean;
  createdAt: string;
}

// 화장실 타입
export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "public" | "user";
  hasPassword: boolean;
  passwordHint?: string;
  rating?: number;
  ratingCount?: number;
  creatorName?: string;
  createdAt: string;
}

// 별점 타입
export interface Rating {
  id: string;
  rating: number;
  userName: string;
  createdAt: string;
}

// API 요청을 위한 기본 fetch 함수
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem("authToken");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API 요청 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
};

// 화장실 API 함수들
export const toiletAPI = {
  // 모든 화장실 목록 가져오기 (DB에 저장된 사용자 등록 화장실)
  getAll: () => apiRequest<{ count: number; data: Toilet[] }>("/toilets"),

  // 공공 화장실 목록 가져오기 (서울교통공사 API - 실시간)
  getPublicToilets: (stationName?: string) => {
    const url = stationName
      ? `/public-toilets/metro?station=${encodeURIComponent(stationName)}`
      : "/public-toilets/metro";
    return apiRequest<{ count: number; data: Toilet[] }>(url);
  },

  // 근처 역 찾기 (좌표 기반)
  getNearbyStations: (lat: number, lng: number, limit = 3) =>
    apiRequest<{
      success: boolean;
      stations: Array<{
        name: string;
        distance: number;
        lat: number;
        lng: number;
      }>;
    }>(`/public-toilets/nearby-stations?lat=${lat}&lng=${lng}&limit=${limit}`),

  // 특정 화장실 상세 정보 가져오기
  getById: (id: string) => apiRequest<{ data: Toilet }>(`/toilets/${id}`),

  // 새 화장실 등록하기
  create: (toiletData: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: "public" | "user";
    hasPassword?: boolean;
    passwordHint?: string;
    creatorId?: string;
  }) =>
    apiRequest<{ data: Toilet }>("/toilets", {
      method: "POST",
      body: JSON.stringify(toiletData),
    }),

  // 화장실 정보 수정하기
  update: (
    id: string,
    updateData: Partial<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      hasPassword: boolean;
      passwordHint: string;
    }>
  ) =>
    apiRequest<{ data: Toilet }>(`/toilets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  // 화장실 삭제하기
  delete: (id: string) =>
    apiRequest(`/toilets/${id}`, {
      method: "DELETE",
    }),
};

// 별점 API 함수들
export const ratingAPI = {
  // 별점 등록/수정하기
  create: (toiletId: string, userId: string, rating: number) =>
    apiRequest<{ data: Rating }>(`/ratings/toilets/${toiletId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ userId, rating }),
    }),

  // 특정 화장실의 별점 목록 가져오기
  getByToilet: (toiletId: string) =>
    apiRequest<{
      data: {
        toiletName: string;
        totalRatings: number;
        averageRating: number;
        ratingDistribution: Record<string, number>;
        ratings: Rating[];
      };
    }>(`/ratings/toilets/${toiletId}/ratings`),

  // 특정 사용자의 별점 목록 가져오기
  getByUser: (userId: string) => apiRequest(`/ratings/users/${userId}/ratings`),

  // 별점 삭제하기
  delete: (ratingId: string) =>
    apiRequest(`/ratings/${ratingId}`, {
      method: "DELETE",
    }),
};

// 수정 요청 API 함수들
export const editRequestAPI = {
  // 수정 요청 제출하기
  create: (
    toiletId: string,
    userId: string,
    reason: string,
    description?: string
  ) =>
    apiRequest(`/edit-requests/toilets/${toiletId}/edit-requests`, {
      method: "POST",
      body: JSON.stringify({ userId, reason, description }),
    }),

  // 특정 화장실의 수정 요청 목록 가져오기
  getByToilet: (toiletId: string, status?: string) =>
    apiRequest(
      `/edit-requests/toilets/${toiletId}/edit-requests${
        status ? `?status=${status}` : ""
      }`
    ),

  // 사용자별 수정 요청 목록 가져오기
  getByUser: (userId: string, status?: string) =>
    apiRequest(
      `/edit-requests/users/${userId}/edit-requests${
        status ? `?status=${status}` : ""
      }`
    ),

  // 관리자: 모든 수정 요청 조회
  getAllAdmin: (status?: string, page: number = 1, limit: number = 20) =>
    apiRequest(
      `/edit-requests/admin/edit-requests?${new URLSearchParams({
        ...(status && { status }),
        page: page.toString(),
        limit: limit.toString(),
      })}`
    ),

  // 관리자: 수정 요청 승인/거부
  updateStatus: (
    requestId: string,
    status: "approved" | "rejected",
    adminResponse?: string
  ) =>
    apiRequest(`/edit-requests/admin/edit-requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify({ status, adminResponse }),
    }),
};

// 인증 API 함수들
export const authAPI = {
  // 회원가입
  register: (email: string, password: string, name: string) =>
    apiRequest<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  // 로그인
  login: (email: string, password: string) =>
    apiRequest<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // 내 정보 조회
  getMe: () =>
    apiRequest<{
      data: {
        user: User;
        stats: {
          toiletsRegistered: number;
          ratingsGiven: number;
          editRequestsSubmitted: number;
        };
      };
    }>("/auth/me"),

  // 비밀번호 변경
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// 토큰 및 사용자 정보 관리 유틸리티
export const authUtils = {
  // 토큰 저장
  setToken: (token: string) => {
    localStorage.setItem("authToken", token);
  },

  // 토큰 가져오기
  getToken: (): string | null => {
    return localStorage.getItem("authToken");
  },

  // 사용자 정보 저장
  setUser: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
  },

  // 사용자 정보 가져오기
  getUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // 로그인 상태 확인
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("authToken");
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },
};
