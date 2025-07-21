"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
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

interface PendingToilet {
  id: string;
  name: string;
  address: string;
  description: string;
  hasPassword: boolean;
  passwordHint?: string;
  photos: string[];
  submittedAt: string;
  submittedBy: string;
}

const mockPendingToilets: PendingToilet[] = [
  {
    id: "1",
    name: "카페베네 신촌점",
    address: "서울시 서대문구 신촌로 123",
    description: "2층에 위치, 카페 이용객만 사용 가능",
    hasPassword: true,
    passwordHint: "카운터에서 문의",
    photos: ["/placeholder.svg?height=200&width=300"],
    submittedAt: "2024-01-15 14:30",
    submittedBy: "user123",
  },
  {
    id: "2",
    name: "홍대 공원 화장실",
    address: "서울시 마포구 홍익로 456",
    description: "24시간 이용 가능한 공원 화장실",
    hasPassword: false,
    photos: ["/placeholder.svg?height=200&width=300"],
    submittedAt: "2024-01-15 10:15",
    submittedBy: "user456",
  },
];

export default function AdminPage() {
  const [pendingToilets, setPendingToilets] =
    useState<PendingToilet[]>(mockPendingToilets);
  const [selectedToilet, setSelectedToilet] = useState<PendingToilet | null>(
    null
  );

  const handleApprove = (id: string) => {
    setPendingToilets((prev) => prev.filter((toilet) => toilet.id !== id));
    setSelectedToilet(null);
    alert("화장실이 승인되었습니다.");
  };

  const handleReject = (id: string) => {
    setPendingToilets((prev) => prev.filter((toilet) => toilet.id !== id));
    setSelectedToilet(null);
    alert("화장실 등록이 거부되었습니다.");
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
                          <p>{toilet.submittedAt}</p>
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedToilet(toilet)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(toilet.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(toilet.id)}
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
                  className="flex-1"
                  onClick={() => handleApprove(selectedToilet.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  승인
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedToilet.id)}
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
