"use client";
import React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AddToiletPage() {
  const [hasPassword, setHasPassword] = useState(false);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">화장실 등록</h1>

      {/* 이름 */}
      <div className="space-y-2">
        <Label>이름</Label>
        <Input placeholder="예: 스타벅스 홍대점" />
      </div>

      {/* 위치 선택 (간단하게 좌표 필드 대체) */}
      <div className="space-y-2">
        <Label>위치</Label>
        <Input placeholder="위도,경도 자동입력 or 지도 선택" disabled />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label>설명</Label>
        <Textarea placeholder="비회원도 사용 가능, 직원 친절 등 간단한 설명" />
      </div>

      {/* 비밀번호 유무 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasPassword"
          checked={hasPassword}
          onCheckedChange={(v) => setHasPassword(Boolean(v))}
        />
        <Label htmlFor="hasPassword">비밀번호 있음</Label>
      </div>

      {/* 제출 */}
      <Button className="w-full">등록 요청</Button>
    </div>
  );
}
