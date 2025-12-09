"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { ArrowLeft, Check, X, Eye, Lock, Unlock } from "lucide-react";
import { authUtils } from "@/lib/api";

interface PendingToilet {
  id: string;
  name: string;
  address: string;
  description: string;
  hasPassword: boolean;
  passwordHint?: string;
  photos: string[];
  createdAt: string;
  submittedBy: string;
}

export default function AdminPage() {
  const [pendingToilets, setPendingToilets] = useState<PendingToilet[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<PendingToilet | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 이미지 URL을 전체 URL로 변환하는 함수
  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return "/placeholder.svg";
    
    // 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // 상대 경로인 경우 API 베이스 URL과 결합
    const API_BASE_URL =
      import.meta.env.VITE_API_URL ||
      `${window.location.protocol}//${window.location.hostname}:3002/api`;
    
    // /uploads/로 시작하는 경우
    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      return `${API_BASE_URL.replace("/api", "")}${cleanPath}`;
    }
    
    // /로 시작하는 상대 경로인 경우
    if (url.startsWith("/")) {
      return `${API_BASE_URL.replace("/api", "")}${url}`;
    }
    
    // 그 외의 경우
    return `${API_BASE_URL.replace("/api", "")}/${url}`;
  };

  // 관리자 권한 확인 및 로그인 체크
  useEffect(() => {
    const checkAdminAccess = () => {
      // 로그인 확인
      if (!authUtils.isAuthenticated()) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return false;
      }

      // 관리자 권한 확인
      const user = authUtils.getUser();
      if (!user || user.role !== "admin") {
        alert("관리자 권한이 필요합니다.");
        navigate("/");
        return false;
      }

      return true;
    };

    if (!checkAdminAccess()) {
      return;
    }

    fetchPendingToilets();
  }, [navigate]);

  // 승인 대기 목록 가져오기
  const fetchPendingToilets = async () => {
    try {
      setIsLoading(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const token = authUtils.getToken();
      const response = await fetch(`${API_BASE_URL}/toilets/admin/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setPendingToilets(result.data);
      } else {
        console.error("승인 대기 목록 조회 실패:", result.message);
      }
    } catch (error) {
      console.error("승인 대기 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("이 화장실을 승인하시겠습니까?")) return;

    try {
      const token = authUtils.getToken();
      const API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const response = await fetch(
        `${API_BASE_URL}/toilets/admin/${id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("화장실이 승인되었습니다.");
        setPendingToilets((prev) => prev.filter((toilet) => toilet.id !== id));
        setSelectedToilet(null);
      } else {
        alert(result.message || "승인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 오류:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("이 화장실 등록을 거부하시겠습니까?")) return;

    try {
      const token = authUtils.getToken();
      const API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const response = await fetch(
        `${API_BASE_URL}/toilets/admin/${id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("화장실 등록이 거부되었습니다.");
        setPendingToilets((prev) => prev.filter((toilet) => toilet.id !== id));
        setSelectedToilet(null);
      } else {
        alert(result.message || "거부 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("거부 오류:", error);
      alert("거부 처리 중 오류가 발생했습니다.");
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
            <h1 className="text-lg font-semibold">관리자 페이지</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              승인 대기 ({pendingToilets.length})
            </TabsTrigger>
            <TabsTrigger value="approved">승인 완료</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  로딩 중...
                </CardContent>
              </Card>
            ) : pendingToilets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  승인 대기 중인 화장실이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingToilets.map((toilet) => (
                  <Card
                    key={toilet.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg mb-1">
                            {toilet.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {toilet.address}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            {toilet.hasPassword ? (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                비밀번호 필요
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Unlock className="w-3 h-3 mr-1" />
                                자유이용
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {toilet.description}
                          </p>
                          {toilet.hasPassword && toilet.passwordHint && (
                            <p className="text-xs text-blue-600">
                              비밀번호 힌트: {toilet.passwordHint}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>
                            {new Date(toilet.createdAt).toLocaleString("ko-KR")}
                          </p>
                          <p>by {toilet.submittedBy}</p>
                        </div>
                      </div>

                      {/* 사진 미리보기 */}
                      {toilet.photos && toilet.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {toilet.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={getImageUrl(photo)}
                              alt={`화장실 사진 ${index + 1}`}
                              className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setSelectedToilet(toilet)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mb-4">
                          등록된 사진이 없습니다.
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="touch-manipulation min-h-[48px] w-full sm:w-auto flex-1 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedToilet(toilet);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          상세보기
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="touch-manipulation min-h-[48px] w-full sm:w-auto flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(toilet.id);
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="touch-manipulation min-h-[48px] w-full sm:w-auto flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-medium shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(toilet.id);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          거부
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                승인된 화장실 목록이 여기에 표시됩니다.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 상세보기 모달 */}
      {selectedToilet && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-0 rounded-xl">
            <CardHeader className="bg-white border-b border-gray-200 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {selectedToilet.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 rounded-full h-8 w-8 p-0"
                  onClick={() => setSelectedToilet(null)}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 bg-white">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800 flex items-center">
                  📍 주소
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedToilet.address}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800 flex items-center">
                  📝 설명
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedToilet.description}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  🔐 이용 방법
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-md bg-white border">
                  {selectedToilet.hasPassword ? (
                    <>
                      <Lock className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-600">
                        비밀번호 필요
                      </span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        자유이용
                      </span>
                    </>
                  )}
                </div>
                {selectedToilet.hasPassword && selectedToilet.passwordHint && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-700">
                      💡 힌트: {selectedToilet.passwordHint}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  📷 사진
                </h4>
                {selectedToilet.photos && selectedToilet.photos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedToilet.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={getImageUrl(photo)}
                          alt={`화장실 사진 ${index + 1}`}
                          className="w-full rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    등록된 사진이 없습니다.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  className="flex-1 touch-manipulation min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(selectedToilet.id);
                  }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  승인
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 touch-manipulation min-h-[52px] border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-medium shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(selectedToilet.id);
                  }}
                >
                  <X className="w-5 h-5 mr-2" />
                  거부
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
