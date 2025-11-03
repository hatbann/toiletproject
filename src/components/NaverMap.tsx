import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "public" | "user";
  hasPassword: boolean;
  rating?: number;
}

interface NaverMapProps {
  toilets: Toilet[];
  center?: { lat: number; lng: number };
  onToiletClick?: (toilet: Toilet) => void;
}

const NaverMap: React.FC<NaverMapProps> = ({
  toilets,
  center = { lat: 37.5665, lng: 126.978 }, // 서울 시청 기본 좌표
  onToiletClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 네이버 지도 API 로딩 확인
  useEffect(() => {
    const checkNaverMaps = () => {
      if (window.naver && window.naver.maps) {
        console.log("✅ 네이버 지도 API 로딩 완료");
        setMapLoaded(true);
      } else {
        console.log("⏳ 네이버 지도 API 로딩 대기 중...");
        setTimeout(checkNaverMaps, 100);
      }
    };

    checkNaverMaps();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current) {
      console.log("지도 초기화 대기:", {
        mapLoaded,
        hasContainer: !!mapContainer.current,
      });
      return;
    }

    try {
      console.log("🗺️ 지도 초기화 시작:", center);

      // 지도 옵션
      const mapOptions = {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
        mapTypeControl: false,
      };

      // 지도 생성
      const map = new window.naver.maps.Map(mapContainer.current, mapOptions);
      mapRef.current = map;

      console.log("✅ 지도 생성 완료");

      // 지도 로드 완료 이벤트
      window.naver.maps.Event.addListener(map, "idle", () => {
        console.log("지도 로드 완료");
      });
    } catch (err) {
      console.error("❌ 지도 초기화 실패:", err);
      setError("지도를 불러오는 중 오류가 발생했습니다.");
    }
  }, [mapLoaded, center]);

  // 마커 추가
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) {
      console.log("마커 추가 대기 중...");
      return;
    }

    if (toilets && toilets.length !== 0) {
      try {
        console.log(`🎯 ${toilets.length}개의 마커 추가 시작`);

        // 기존 마커 제거
        markersRef.current.forEach((marker) => marker.setMap(null));
        infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
        markersRef.current = [];
        infoWindowsRef.current = [];

        // 화장실 마커 추가
        toilets.forEach((toilet) => {
          const position = new window.naver.maps.LatLng(
            toilet.latitude,
            toilet.longitude
          );

          // 마커 아이콘 설정
          const markerIcon = {
            content: `
            <div style="
              background-color: ${
                toilet.type === "public" ? "#ff4444" : "#4444ff"
              };
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              cursor: pointer;
            ">
              🚽
            </div>
          `,
            size: new window.naver.maps.Size(30, 30),
            anchor: new window.naver.maps.Point(15, 15),
          };

          const marker = new window.naver.maps.Marker({
            position: position,
            map: mapRef.current,
            icon: markerIcon,
          });

          markersRef.current.push(marker);

          // 정보창 내용
          const contentString = `
          <div style="
            padding: 10px;
            font-size: 12px;
            width: 220px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
              ${toilet.name}
            </div>
            <div style="color: #666; margin-bottom: 5px;">
              ${toilet.address}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <span style="
                color: ${toilet.hasPassword ? "#ff4444" : "#44ff44"};
                font-weight: 500;
              ">
                ${toilet.hasPassword ? "🔒 비밀번호 필요" : "🔓 자유이용"}
              </span>
              ${
                toilet.rating
                  ? `
                <span style="color: orange; font-weight: 500;">
                  ⭐ ${toilet.rating.toFixed(1)}
                </span>
              `
                  : ""
              }
            </div>
            <div style="
              margin-top: 8px;
              padding: 4px 8px;
              background: ${toilet.type === "public" ? "#ffebee" : "#e3f2fd"};
              border-radius: 4px;
              color: ${toilet.type === "public" ? "#c62828" : "#1565c0"};
              font-size: 11px;
              text-align: center;
              font-weight: 500;
            ">
              ${toilet.type === "public" ? "공공 화장실" : "사용자 등록"}
            </div>
          </div>
        `;

          const infoWindow = new window.naver.maps.InfoWindow({
            content: contentString,
            borderWidth: 0,
            backgroundColor: "transparent",
            disableAnchor: true,
            pixelOffset: new window.naver.maps.Point(0, -10),
          });

          infoWindowsRef.current.push(infoWindow);

          // 마커 클릭 이벤트
          window.naver.maps.Event.addListener(marker, "click", () => {
            infoWindowsRef.current.forEach((iw) => iw.close());
            infoWindow.open(mapRef.current, marker);
            if (onToiletClick) {
              onToiletClick(toilet);
            }
          });

          // 마커 마우스오버 이벤트
          window.naver.maps.Event.addListener(marker, "mouseover", () => {
            infoWindow.open(mapRef.current, marker);
          });
        });

        console.log(`✅ ${markersRef.current.length}개의 마커 추가 완료`);
      } catch (err) {
        console.error("❌ 마커 추가 실패:", err);
        setError("마커를 추가하는 중 오류가 발생했습니다.");
      }
    }
  }, [toilets, mapLoaded, onToiletClick]);

  // 중심 위치 변경
  useEffect(() => {
    if (mapRef.current && window.naver) {
      const newCenter = new window.naver.maps.LatLng(center.lat, center.lng);
      mapRef.current.setCenter(newCenter);
    }
  }, [center]);

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("현재 위치를 가져올 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const moveLatLng = new window.naver.maps.LatLng(lat, lng);

        if (mapRef.current) {
          mapRef.current.setCenter(moveLatLng);

          // 현재 위치 마커 추가
          const currentMarker = new window.naver.maps.Marker({
            position: moveLatLng,
            map: mapRef.current,
            icon: {
              content: `
                <div style="
                  background-color: #4285f4;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>
              `,
              size: new window.naver.maps.Size(20, 20),
              anchor: new window.naver.maps.Point(10, 10),
            },
          });

          markersRef.current.push(currentMarker);
        }
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
  };

  if (error) {
    return (
      <div className="w-full h-64 rounded-lg bg-red-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="font-bold">지도 로딩 오류</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-center">
          <p className="font-bold">지도 로딩 중...</p>
          <p className="text-sm">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-64 rounded-lg" />
      <button
        onClick={moveToCurrentLocation}
        className="absolute top-2 right-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-md hover:bg-gray-50 transition-colors z-10"
      >
        📍 현재 위치
      </button>
    </div>
  );
};

export default NaverMap;
