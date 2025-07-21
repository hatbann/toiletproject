"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Camera, MapPin, Upload } from "lucide-react";
import { Link } from "react-router-dom";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    hasPassword: false,
    passwordHint: "",
    photos: [] as File[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 서버로 데이터 전송
    console.log("등록 데이터:", formData);
    alert(
      "화장실 등록 요청이 제출되었습니다. 관리자 승인 후 지도에 표시됩니다."
    );
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">화장실 이름 *</Label>
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
                  <Label htmlFor="address">주소 *</Label>
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
                    <Button type="button" variant="outline" size="sm">
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    지도에서 정확한 위치를 선택할 수 있습니다
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">상세 설명</Label>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>비밀번호 필요 여부</Label>
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
                    <Label htmlFor="passwordHint">비밀번호 힌트</Label>
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
                  <Label>인증 사진 *</Label>
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
                <Button type="submit" className="w-full" size="lg">
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
    </div>
  );
}
