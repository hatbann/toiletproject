import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Users, LogOut } from "lucide-react";
import { authUtils } from "@/lib/api";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [publicCount, setPublicCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const authenticated = authUtils.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const user = authUtils.getUser();
      setUserName(user?.name || "사용자");
    }

    // 통계 데이터 가져오기
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.hostname}:3002/api`;
      const response = await fetch(`${API_BASE_URL}/toilets/stats/counts`);
      const result = await response.json();

      if (result.success && result.data) {
        setPublicCount(result.data.publicToilets);
        setUserCount(result.data.userToilets);
      }
    } catch (error) {
      console.error("통계 조회 실패:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = () => {
    authUtils.logout();
    setIsAuthenticated(false);
    setUserName("");
    alert("로그아웃되었습니다.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4 gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">
                    {userName}님
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  로그아웃
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
            )}
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
              {isLoadingStats ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {publicCount.toLocaleString()}
                </div>
              )}
              <div className="text-sm text-gray-600">공공화장실</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              {isLoadingStats ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {userCount.toLocaleString()}
                </div>
              )}
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
