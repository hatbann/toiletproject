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

  // 화장실 데이터 로드
  useEffect(() => {
    const loadToilets = async () => {
      try {
        setLoading(true);
        const response = await toiletAPI.getAll();

        if (response.success && response.data) {
          setToilets(response.data.data);
          setError(null);
        } else {
          setError(response.error || "화장실 데이터를 불러올 수 없습니다.");
        }
      } catch (err) {
        setError("네트워크 오류가 발생했습니다.");
        console.error("화장실 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadToilets();
  }, []);

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
          onToiletClick={(toilet) => {
            console.log("화장실 클릭:", toilet);
            // 필요시 화장실 상세 정보 모달 등을 표시할 수 있음
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
          <div className="space-y-3">
            {toilets &&
              toilets.map((toilet) => (
                <Card
                  key={toilet.id}
                  className="hover:shadow-md transition-shadow py-0"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{toilet.name}</h3>
                          <Badge
                            variant={
                              toilet.type === "public" ? "default" : "secondary"
                            }
                          >
                            {toilet.type === "public" ? "공공" : "사용자"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {toilet.address}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-blue-600 font-medium">
                            {calculateDistance(
                              mapCenter.lat,
                              mapCenter.lng,
                              toilet.latitude,
                              toilet.longitude
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {toilet.hasPassword ? (
                              <>
                                <Lock className="w-3 h-3 text-red-500 flex-shrink-0" />
                                {isLoggedIn ? (
                                  <span className="text-red-500 text-xs">
                                    비밀번호: 1234
                                  </span>
                                ) : (
                                  <span className="text-red-500 text-xs">
                                    로그인 필요
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span className="text-green-500 text-xs">
                                  자유이용
                                </span>
                              </>
                            )}
                          </div>
                          <button
                            className="flex items-center gap-1 text-yellow-600 text-xs hover:text-yellow-700 hover:bg-yellow-50 px-2 py-1 rounded transition-colors"
                            onClick={() => handleRatingClick(toilet)}
                          >
                            <span>⭐ {toilet.rating || "평점 없음"}</span>
                            <span className="text-gray-500 text-xs">
                              클릭하여 별점 남기기
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          길찾기
                        </Button>
                        {toilet.type === "user" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRequest(toilet)}
                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                          >
                            수정요청
                          </Button>
                        )}
                      </div>
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
