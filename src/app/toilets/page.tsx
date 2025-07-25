"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Toilet {
  id: string;
  name: string;
  address: string;
  distance: string;
  type: "public" | "user";
  hasPassword: boolean;
  rating?: number;
}

const mockToilets: Toilet[] = [
  {
    id: "1",
    name: "강남역 공공화장실",
    address: "서울시 강남구 강남대로 지하",
    distance: "50m",
    type: "public",
    hasPassword: false,
  },
  {
    id: "2",
    name: "스타벅스 강남점",
    address: "서울시 강남구 테헤란로 123",
    distance: "120m",
    type: "user",
    hasPassword: true,
    rating: 4.5,
  },
  {
    id: "3",
    name: "CGV 강남점",
    address: "서울시 강남구 강남대로 456",
    distance: "200m",
    type: "user",
    hasPassword: false,
    rating: 4.2,
  },
];

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [toilets] = useState<Toilet[]>(mockToilets);
  // 임시 로그인 상태 (실제로는 컨텍스트나 전역 상태로 관리해야 함)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [editRequest, setEditRequest] = useState({
    reason: "",
    description: "",
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingToilet, setRatingToilet] = useState<Toilet | null>(null);
  const [userRating, setUserRating] = useState(0);

  const handleEditRequest = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setShowEditModal(true);
  };

  const handleSubmitEditRequest = () => {
    if (!selectedToilet || !editRequest.reason.trim()) return;

    alert("수정 요청이 제출되었습니다. 관리자 검토 후 반영됩니다.");
    setShowEditModal(false);
    setSelectedToilet(null);
    setEditRequest({ reason: "", description: "" });
  };

  const handleRatingClick = (toilet: Toilet) => {
    if (!isLoggedIn) {
      alert("별점을 남기려면 로그인이 필요합니다.");
      return;
    }
    setRatingToilet(toilet);
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (!ratingToilet || userRating === 0) return;

    alert(`${userRating}점을 남겼습니다.`);
    setShowRatingModal(false);
    setRatingToilet(null);
    setUserRating(0);
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
              onClick={() => setIsLoggedIn(!isLoggedIn)}
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

      {/* Map Placeholder */}
      <div className="container mx-auto px-4 mb-4">
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p>지도가 여기에 표시됩니다</p>
            <p className="text-sm">(카카오맵 또는 네이버맵 API 연동)</p>
          </div>
        </div>
      </div>

      {/* Current Location Button */}
      <div className="container mx-auto px-4 mb-4">
        <Button className="w-full bg-transparent" variant="outline">
          <Navigation className="w-4 h-4 mr-2" />
          현재 위치에서 찾기
        </Button>
      </div>

      {/* Toilet List */}
      <div className="container mx-auto px-4 pb-8">
        <h2 className="text-lg font-semibold mb-4">
          근처 화장실 ({toilets.length}개)
        </h2>
        <div className="space-y-3">
          {toilets.map((toilet) => (
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
                        {toilet.distance}
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
