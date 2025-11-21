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
  const [selectedToilet, setSelectedToilet] = useState<PendingToilet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      if (!user || user.role !== 'admin') {
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const token = authUtils.getToken();
      const response = await fetch(
        `${API_BASE_URL}/toilets/admin/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002/api`;
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002/api`;
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
            {pendingToilets.length === 0 ? (
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
                          <p>{new Date(toilet.createdAt).toLocaleString('ko-KR')}</p>
                          <p>by {toilet.submittedBy}</p>
                        </div>
                      </div>

                      {/* 사진 미리보기 */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {toilet.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo || "/placeholder.svg"}
                            alt={`화장실 사진 ${index + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedToilet(toilet)}
                          />
                        ))}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="touch-manipulation min-h-[44px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedToilet(toilet);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="touch-manipulation min-h-[44px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(toilet.id);
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="touch-manipulation min-h-[44px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(toilet.id);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{selectedToilet.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedToilet(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">주소</h4>
                <p className="text-sm text-gray-600">
                  {selectedToilet.address}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">설명</h4>
                <p className="text-sm text-gray-600">
                  {selectedToilet.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">이용 방법</h4>
                <div className="flex items-center gap-2">
                  {selectedToilet.hasPassword ? (
                    <>
                      <Lock className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">
                        비밀번호 필요
                      </span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">자유이용</span>
                    </>
                  )}
                </div>
                {selectedToilet.hasPassword && selectedToilet.passwordHint && (
                  <p className="text-sm text-blue-600 mt-1">
                    힌트: {selectedToilet.passwordHint}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">사진</h4>
                <div className="space-y-2">
                  {selectedToilet.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo || "/placeholder.svg"}
                      alt={`화장실 사진 ${index + 1}`}
                      className="w-full rounded"
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 touch-manipulation min-h-[48px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(selectedToilet.id);
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  승인
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 touch-manipulation min-h-[48px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(selectedToilet.id);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
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
