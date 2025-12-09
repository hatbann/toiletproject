"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import NaverMap from "@/components/NaverMap";
import {
  toiletAPI,
  ratingAPI,
  editRequestAPI,
  authUtils,
  type Toilet,
} from "@/lib/api";
import { ArrowLeft, Navigation, Search, Lock, Unlock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// 거리 계산 함수 (간단한 직선 거리)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c * 1000; // 미터로 변환

  if (d < 1000) {
    return `${Math.round(d)}m`;
  } else {
    return `${(d / 1000).toFixed(1)}km`;
  }
};

export default function MapPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(authUtils.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authUtils.getUser());
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [editRequest, setEditRequest] = useState({
    reason: "",
    description: "",
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingToilet, setRatingToilet] = useState<Toilet | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [mapCenter, setMapCenter] = useState({ lat: 37.4979, lng: 127.0276 });
  const [focusToiletId, setFocusToiletId] = useState<string | null>(null);

  // 초기 로딩 시 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log(`📍 현재 위치: (${lat}, ${lng})`);
          setMapCenter({ lat, lng });
        },
        (error) => {
          console.warn("위치 정보를 가져올 수 없어 기본 위치(강남역)를 사용합니다:", error);
          // 위치 정보를 가져올 수 없으면 기본값(강남역) 유지
        }
      );
    } else {
      console.warn("Geolocation을 지원하지 않는 브라우저입니다. 기본 위치(강남역)를 사용합니다.");
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 화장실 데이터 로드 (DB + 공공 API 병합)
  useEffect(() => {
    const loadToilets = async () => {
      try {
        setLoading(true);
        console.log('🚽 화장실 데이터 로딩 시작...');

        // 1. DB에서 사용자 등록 화장실 가져오기
        console.log('📦 DB 화장실 로딩...');
        const userToiletsResponse = await toiletAPI.getAll();

        // 2. 현재 지도 중심 좌표 기반으로 근처 역 찾기
        console.log(`📍 근처 역 찾기... (${mapCenter.lat}, ${mapCenter.lng})`);
        const nearbyStationsResponse = await toiletAPI.getNearbyStations(mapCenter.lat, mapCenter.lng, 3);

        // 3. 근처 역들의 화장실 가져오기
        console.log('🚇 근처 역 화장실 로딩...');
        let publicToiletsResponse;
        if (nearbyStationsResponse.success && nearbyStationsResponse.data?.stations && nearbyStationsResponse.data.stations.length > 0) {
          const nearestStation = nearbyStationsResponse.data.stations[0];
          console.log(`✅ 가장 가까운 역: ${nearestStation.name} (${nearestStation.distance.toFixed(2)}km)`);
          publicToiletsResponse = await toiletAPI.getPublicToilets(nearestStation.name);
        } else {
          console.log('⚠️ 근처 역을 찾을 수 없어 전체 화장실을 가져옵니다.');
          publicToiletsResponse = await toiletAPI.getPublicToilets();
        }

        console.log('📡 DB 응답:', userToiletsResponse);
        console.log('📡 공공 API 응답:', publicToiletsResponse);

        // 3. 두 데이터 병합
        let allToilets: Toilet[] = [];

        // DB 화장실 추가 (type을 'user'로 설정)
        if (userToiletsResponse.success && userToiletsResponse.data) {
          const userToiletsData = Array.isArray(userToiletsResponse.data)
            ? userToiletsResponse.data
            : (userToiletsResponse.data as { count: number; data: Toilet[] }).data;

          const userToilets = (userToiletsData || []).map(toilet => ({
            ...toilet,
            type: 'user' as const // 사용자 등록 화장실
          }));

          allToilets = [...userToilets];
          console.log(`✅ DB 화장실: ${userToilets.length}개`);
        }

        // 공공 화장실 추가 (type은 이미 'public'으로 설정됨)
        if (publicToiletsResponse.success && publicToiletsResponse.data) {
          const publicToiletsData = Array.isArray(publicToiletsResponse.data)
            ? publicToiletsResponse.data
            : (publicToiletsResponse.data as { count: number; data: Toilet[] }).data;

          allToilets = [...allToilets, ...(publicToiletsData || [])];
          console.log(`✅ 공공 화장실: ${publicToiletsData?.length || 0}개`);
        }

        console.log(`📊 총 화장실 개수: ${allToilets.length}개`);

        // 4. 거리순으로 정렬 (가까운 순)
        const toiletsWithDistance = allToilets.map(toilet => {
          const R = 6371; // 지구 반지름 (km)
          const dLat = (toilet.latitude - mapCenter.lat) * Math.PI / 180;
          const dLng = (toilet.longitude - mapCenter.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(mapCenter.lat * Math.PI / 180) * Math.cos(toilet.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return { ...toilet, distance };
        });

        // 거리순 정렬 후 상위 10개만 선택
        const sortedToilets = toiletsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10)
          .map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { distance, ...toilet } = item;
            return toilet as Toilet;
          });

        console.log(`📍 가까운 화장실 10개만 표시`);
        setToilets(sortedToilets);
        setError(null);

      } catch (err) {
        setError("네트워크 오류가 발생했습니다.");
        console.error("화장실 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadToilets();
  }, [mapCenter]); // mapCenter가 변경될 때마다 근처 역의 화장실을 다시 로드

  const handleEditRequest = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setShowEditModal(true);
  };

  const handleCurrentLocationClick = () => {
    if (!navigator.geolocation) {
      alert("현재 위치를 가져올 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
  };

  const handleSubmitEditRequest = async () => {
    if (!selectedToilet || !editRequest.reason.trim() || !currentUser) return;

    try {
      const response = await editRequestAPI.create(
        selectedToilet.id,
        currentUser.id,
        editRequest.reason,
        editRequest.description || undefined
      );

      if (response.success) {
        alert("수정 요청이 제출되었습니다. 관리자 검토 후 반영됩니다.");
        setShowEditModal(false);
        setSelectedToilet(null);
        setEditRequest({ reason: "", description: "" });
      } else {
        alert("수정 요청 제출에 실패했습니다: " + response.error);
      }
    } catch (error) {
      console.error("수정 요청 제출 실패:", error);
      alert("수정 요청 제출 중 오류가 발생했습니다.");
    }
  };

  const handleRatingClick = (toilet: Toilet) => {
    if (!isLoggedIn) {
      alert("별점을 남기려면 로그인이 필요합니다.");
      return;
    }
    setRatingToilet(toilet);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingToilet || userRating === 0 || !currentUser) return;

    try {
      const response = await ratingAPI.create(
        ratingToilet.id,
        currentUser.id,
        userRating
      );

      if (response.success) {
        alert(`${userRating}점을 남겼습니다.`);
        setShowRatingModal(false);
        setRatingToilet(null);
        setUserRating(0);

        // 화장실 목록 새로고침
        const toiletsResponse = await toiletAPI.getAll();
        if (toiletsResponse.success && toiletsResponse.data) {
          setToilets(toiletsResponse.data.data);
        }
      } else {
        alert("별점 등록에 실패했습니다: " + response.error);
      }
    } catch (error) {
      console.error("별점 등록 실패:", error);
      alert("별점 등록 중 오류가 발생했습니다.");
    }
  };

  // 로그인/로그아웃 핸들러
  const handleAuthClick = () => {
    if (isLoggedIn) {
      // 로그아웃
      if (confirm("로그아웃 하시겠습니까?")) {
        authUtils.logout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        alert("로그아웃되었습니다.");
      }
    } else {
      // 로그인 페이지로 이동
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">화장실 찾기</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAuthClick}
              className="ml-auto"
            >
              {isLoggedIn ? "로그아웃" : "로그인"}
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-400 w-4 h-4" />
          <Input
            placeholder="주소나 장소명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Naver Map */}
      <div className="container mx-auto px-4 mb-4">
        <NaverMap
          toilets={toilets}
          center={mapCenter}
          focusToiletId={focusToiletId}
          onToiletClick={(toilet) => {
            console.log("화장실 클릭:", toilet);
            // 필요시 화장실 상세 정보 모달 등을 표시할 수 있음
          }}
          onReviewClick={(toilet) => {
            handleRatingClick(toilet);
          }}
          onCenterChanged={(newCenter) => {
            console.log("🗺️ 지도 중심 변경됨:", newCenter);
            setMapCenter(newCenter);
          }}
        />
      </div>

      {/* Current Location Button */}
      <div className="container mx-auto px-4 mb-4">
        <Button
          className="w-full bg-transparent"
          variant="outline"
          onClick={handleCurrentLocationClick}
        >
          <Navigation className="w-4 h-4 mr-2" />
          현재 위치에서 찾기
        </Button>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-gray-600">화장실 정보를 불러오는 중...</div>
        </div>
      )}

      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            오류: {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-2 underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* Toilet List */}
      {!loading && !error && (
        <div className="container mx-auto px-4 pb-8">
          <h2 className="text-lg font-semibold mb-4">
            {/*          근처 화장실 ({toilets.length}개) */}
          </h2>
          <div className="space-y-2">
            {toilets &&
              toilets.map((toilet) => (
                <Card
                  key={toilet.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 py-3"
                  onClick={(e) => {
                    // 버튼 클릭은 카드 클릭 이벤트에서 제외
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    setFocusToiletId(toilet.id);
                  }}
                >
                  <CardContent className="px-3 py-0">
                    {/* 헤더: 이름 + 타입 배지 */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {toilet.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs border-gray-300 text-gray-600"
                        >
                          {toilet.type === "public" ? "공공" : "사용자"}
                        </Badge>
                      </div>
                    </div>

                    {/* 주소 */}
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {toilet.address}
                    </p>

                    {/* 정보 태그들 */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 mb-2">
                      {/* 거리 */}
                      <span className="inline-flex items-center gap-1">
                        <span className="text-blue-600 font-medium">
                          {calculateDistance(
                            mapCenter.lat,
                            mapCenter.lng,
                            toilet.latitude,
                            toilet.longitude
                          )}
                        </span>
                      </span>

                      <span className="text-gray-300">•</span>

                      {/* 자유이용/비밀번호 */}
                      {toilet.hasPassword ? (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Lock className="w-3 h-3" />
                          {toilet.passwordHint ? `힌트: ${toilet.passwordHint}` : "비밀번호 필요"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Unlock className="w-3 h-3" />
                          자유이용
                        </span>
                      )}

                      <span className="text-gray-300">•</span>

                      {/* 별점 */}
                      <span className="inline-flex items-center gap-1">
                        ⭐ {toilet.rating ? toilet.rating.toFixed(1) : "-"}
                      </span>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 touch-manipulation min-h-[36px] text-xs"
                      >
                        길찾기
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRatingClick(toilet);
                        }}
                        className="flex-1 touch-manipulation min-h-[36px] text-xs"
                      >
                        별점
                      </Button>
                      {toilet.type === "user" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRequest(toilet);
                          }}
                          className="flex-1 touch-manipulation min-h-[36px] text-xs"
                        >
                          수정
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* 수정 요청 모달 */}
      {showEditModal && selectedToilet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              수정 요청 - {selectedToilet.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  수정 사유 *
                </label>
                <select
                  value={editRequest.reason}
                  onChange={(e) =>
                    setEditRequest((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full p-1.5 border border-gray-300 rounded-md text-sm [&>option]:py-1"
                  size={5}
                >
                  <option value="">수정 사유를 선택하세요</option>
                  <option value="주소 변경">주소 변경</option>
                  <option value="비밀번호 변경">비밀번호 변경</option>
                  <option value="영업시간 변경">영업시간 변경</option>
                  <option value="폐점">폐점</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  상세 설명
                </label>
                <textarea
                  value={editRequest.description}
                  onChange={(e) =>
                    setEditRequest((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="수정 내용에 대한 상세한 설명을 입력해주세요"
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedToilet(null);
                  setEditRequest({ reason: "", description: "" });
                }}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitEditRequest}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={!editRequest.reason.trim()}
              >
                요청 제출
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 별점 모달 */}
      {showRatingModal && ratingToilet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">
              별점 남기기 - {ratingToilet.name}
            </h3>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  이 화장실에 별점을 남겨주세요
                </p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="text-3xl p-1 rounded transition-all duration-200 hover:scale-105"
                    >
                      {star <= userRating ? (
                        <span className="text-yellow-500">★</span>
                      ) : (
                        <span className="text-gray-300 hover:text-yellow-400">
                          ☆
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {userRating > 0
                    ? `${userRating}점을 선택했습니다`
                    : "별을 클릭하여 점수를 선택하세요"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowRatingModal(false);
                  setRatingToilet(null);
                  setUserRating(0);
                }}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitRating}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                disabled={userRating === 0}
              >
                별점 제출
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
