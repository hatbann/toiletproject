"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Camera, MapPin, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authUtils } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    hasPassword: false,
    passwordHint: "",
    photos: [] as File[],
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 로그인 여부 확인
  useEffect(() => {
    const authenticated = authUtils.isAuthenticated();
    if (!authenticated) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 유효성 검사
    if (!formData.name.trim() || !formData.address.trim()) {
      alert("화장실 이름과 주소는 필수 입력 항목입니다.");
      return;
    }

    try {
      const user = authUtils.getUser();
      const token = authUtils.getToken();

      if (!user || !token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      // FormData 생성 (이미지 파일과 함께 전송)
      const formDataToSend = new FormData();
      
      // 텍스트 데이터 추가 (trim 처리)
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("address", formData.address.trim());
      if (formData.description) {
        formDataToSend.append("description", formData.description.trim());
      }
      if (formData.latitude) {
        formDataToSend.append("latitude", formData.latitude.toString());
      }
      if (formData.longitude) {
        formDataToSend.append("longitude", formData.longitude.toString());
      }
      formDataToSend.append("hasPassword", formData.hasPassword.toString());
      if (formData.passwordHint) {
        formDataToSend.append("passwordHint", formData.passwordHint.trim());
      }
      formDataToSend.append("creatorId", user.id);

      // 이미지 파일 추가 (최대 3개)
      formData.photos.forEach((photo) => {
        formDataToSend.append("photos", photo);
      });

      // 디버깅: FormData 내용 확인
      console.log('📤 전송할 데이터:', {
        name: formData.name.trim(),
        address: formData.address.trim(),
        photosCount: formData.photos.length
      });

      // API 요청
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const response = await fetch(
        `${API_BASE_URL}/toilets`,
        {
          method: "POST",
          headers: {
            // FormData를 사용할 때는 Content-Type을 설정하지 않음 (브라우저가 자동으로 설정)
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(result.message || "화장실 등록 요청이 제출되었습니다. 관리자 승인 후 지도에 표시됩니다.");
        navigate("/");
      } else {
        alert(result.message || "화장실 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("화장실 등록 오류:", error);
      alert("화장실 등록 중 오류가 발생했습니다.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos].slice(0, 3), // 최대 3장
      }));
    }
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    setIsSearching(true);
    try {
      // 백엔드 프록시를 통해 검색 (CORS 우회)
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const response = await fetch(
        `${API_BASE_URL}/public-toilets/search-address?query=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setSearchResults(result.data);
        } else {
          alert("검색 결과가 없습니다.");
          setSearchResults([]);
        }
      } else {
        alert("주소 검색에 실패했습니다.");
      }
    } catch (error) {
      console.error('주소 검색 실패:', error);
      alert("주소 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: any) => {
    // 네이버 API는 KATEC 좌표계로 반환 (mapx, mapy)
    // WGS84로 변환: longitude = mapx / 10000000, latitude = mapy / 10000000
    const longitude = result.mapx ? parseFloat(result.mapx) / 10000000 : null;
    const latitude = result.mapy ? parseFloat(result.mapy) / 10000000 : null;

    console.log('선택한 주소:', result.title, '좌표:', { latitude, longitude });

    setFormData((prev) => ({
      ...prev,
      address: result.roadAddress || result.address,
      latitude: latitude,
      longitude: longitude,
    }));
    setShowAddressSearch(false);
    setSearchQuery("");
    setSearchResults([]);
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
            <h1 className="text-lg font-semibold">화장실 등록</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>새 화장실 정보 등록</CardTitle>
            <p className="text-sm text-gray-600">
              다른 사용자들을 위해 화장실 정보를 공유해주세요
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 기본 정보 */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="mb-2">
                    화장실 이름 *
                  </Label>
                  <Input
                    id="name"
                    placeholder="예: 스타벅스 강남점, 롯데백화점 1층"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="mb-2">
                    주소 *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      placeholder="서울시 강남구 테헤란로 123"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddressSearch(true)}
                      title="주소 검색"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    지도 버튼을 누르면 주소를 검색할 수 있습니다
                    {formData.latitude && formData.longitude && (
                      <span className="text-green-600 ml-2">
                        ✓ 위치 정보 저장됨 ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2">
                    상세 설명
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="화장실 위치나 이용 방법에 대한 추가 정보를 입력해주세요"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* 비밀번호 정보 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="mb-2">비밀번호 필요 여부</Label>
                    <p className="text-sm text-gray-600">
                      화장실 이용에 비밀번호가 필요한가요?
                    </p>
                  </div>
                  <Switch
                    checked={formData.hasPassword}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, hasPassword: checked }))
                    }
                  />
                </div>

                {formData.hasPassword && (
                  <div>
                    <Label htmlFor="passwordHint" className="mb-2">
                      비밀번호 힌트
                    </Label>
                    <Input
                      id="passwordHint"
                      placeholder="예: 카운터에서 문의, 영수증 뒷면 확인"
                      value={formData.passwordHint}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          passwordHint: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* 사진 업로드 */}
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">인증 사진 *</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    화장실 입구나 내부 사진을 업로드해주세요 (최대 3장)
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        사진을 선택하거나 드래그해주세요
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() =>
                          document.getElementById("photo-upload")?.click()
                        }
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        파일 선택
                      </Button>
                    </label>
                  </div>

                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={
                              URL.createObjectURL(photo) || "/placeholder.svg"
                            }
                            alt={`업로드된 사진 ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                photos: prev.photos.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-500 text-white"
                  size="lg"
                >
                  등록 요청하기
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  관리자 승인 후 지도에 표시됩니다
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 주소 검색 모달 */}
      {showAddressSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-white">
            <CardHeader className="bg-white">
              <CardTitle>주소 검색</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto bg-white">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="주소를 입력하세요 (예: 강남역)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddressSearch();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? "검색 중..." : "검색"}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {searchResults.length}개의 결과
                    </p>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectAddress(result)}
                      >
                        <p className="font-medium" dangerouslySetInnerHTML={{ __html: result.title }} />
                        <p className="text-sm text-gray-600">{result.roadAddress || result.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAddressSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                닫기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
