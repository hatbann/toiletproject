"use client";
import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const pendingList = [
    {
      id: "abc1",
      name: "OO 스타벅스",
      description: "누구나 사용 가능",
      hasPassword: true,
      lat: 37.5,
      lng: 126.9,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">승인 대기 화장실</h1>

      {pendingList.map((toilet) => (
        <Card key={toilet.id}>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold">{toilet.name}</p>
            <p className="text-sm text-muted-foreground">
              {toilet.description}
            </p>
            <p className="text-sm">
              {toilet.hasPassword ? "🔒 비밀번호 있음" : "🔓 누구나 사용 가능"}
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm">✅ 승인</Button>
              <Button size="sm" variant="destructive">
                ❌ 거절
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
