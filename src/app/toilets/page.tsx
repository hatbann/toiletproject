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
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="주소나 장소명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 font-medium">
                        {toilet.distance}
                      </span>
                      <div className="flex items-center gap-1">
                        {toilet.hasPassword ? (
                          <>
                            <Lock className="w-3 h-3 text-red-500" />
                            <span className="text-red-500">비밀번호 필요</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">자유이용</span>
                          </>
                        )}
                      </div>
                      {toilet.rating && (
                        <span className="text-yellow-600">
                          ⭐ {toilet.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    길찾기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
