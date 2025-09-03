import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚽 화장실 찾기
          </h1>
          <p className="text-gray-600">
            급할 때 가장 가까운 화장실을 찾아보세요
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid gap-4 mb-8">
          <Link to="/toilets">
            <Card className="hover:shadow-lg bg-white transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-900">
                  화장실 찾기
                </CardTitle>
                <CardDescription>
                  지도에서 근처 화장실을 찾아보세요
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/add">
            <Card className="hover:shadow-lg bg-white transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-300">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-900">
                  화장실 등록
                </CardTitle>
                <CardDescription>
                  새로운 화장실 정보를 공유해주세요
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">1,234</div>
              <div className="text-sm text-gray-600">공공화장실</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">567</div>
              <div className="text-sm text-gray-600">사용자 등록</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Link */}
        <div className="text-center">
          <Link to="/admin">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-500 bg-transparent"
            >
              <Users className="w-4 h-4 mr-2" />
              관리자 페이지
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
