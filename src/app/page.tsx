import { Button } from "@/components/ui/button";
import React from "react";

export default function HomePage() {
  return (
    <div className="relative h-screen w-full">
      {/* 지도 영역 */}
      <div className="absolute inset-0 z-0">
        {/* TODO: 지도 컴포넌트 삽입 */}
      </div>

      {/* 하단 플로팅 */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-4">
        <Button variant="default">내 위치</Button>
        <Button variant="outline">화장실 등록</Button>
        <Button variant="secondary">리스트 보기</Button>
      </div>
    </div>
  );
}
