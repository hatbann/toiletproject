import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
    handleReviewClick?: (toiletId: string) => void;
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
  passwordHint?: string;
  rating?: number;
  ratingCount?: number;
  creatorName?: string;
  createdAt: string;
}

interface NaverMapProps {
  toilets: Toilet[];
  center?: { lat: number; lng: number };
  onToiletClick?: (toilet: Toilet) => void;
  focusToiletId?: string | null; // 포커스할 화장실 ID
  onReviewClick?: (toilet: Toilet) => void; // 리뷰 쓰기 버튼 클릭
}

const NaverMap: React.FC<NaverMapProps> = ({
  toilets,
  center = { lat: 37.5665, lng: 126.978 }, // 서울 시청 기본 좌표
  onToiletClick,
  focusToiletId,
  onReviewClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const toiletMarkersMap = useRef<Map<string, { marker: any; infoWindow: any; toilet: Toilet }>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // toilets prop 변경 감지
  useEffect(() => {
    console.log('🗺️ NaverMap - toilets prop 변경:', toilets?.length, '개');
    console.log('📍 toilets 데이터:', toilets);
  }, [toilets]);

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

      // 지도 클릭 시 모든 정보창 닫기
      window.naver.maps.Event.addListener(map, "click", () => {
        infoWindowsRef.current.forEach((iw) => iw.close());
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
            padding: 12px;
            font-size: 12px;
            width: 240px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
              <div style="font-weight: bold; font-size: 14px;">
                ${toilet.name}
              </div>
              <span style="
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                background: ${toilet.type === "public" ? "#ffebee" : "#e3f2fd"};
                color: ${toilet.type === "public" ? "#c62828" : "#1565c0"};
                white-space: nowrap;
              ">
                ${toilet.type === "public" ? "🏛️ 공공" : "👤 사용자"}
              </span>
            </div>
            <div style="color: #666; margin-bottom: 8px; font-size: 11px;">
              ${toilet.address}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="
                color: ${toilet.hasPassword ? "#ff4444" : "#44ff44"};
                font-weight: 500;
                font-size: 11px;
              ">
                ${toilet.hasPassword ? "🔒 비밀번호 필요" : "🔓 자유이용"}
              </span>
              ${
                toilet.rating
                  ? `
                <span style="color: orange; font-weight: 500; font-size: 11px;">
                  ⭐ ${toilet.rating.toFixed(1)}
                </span>
              `
                  : ""
              }
            </div>
            <button
              onclick="window.handleReviewClick('${toilet.id}')"
              style="
                width: 100%;
                padding: 6px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
              "
              onmouseover="this.style.transform='scale(1.02)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              ✍️ 리뷰 쓰기
            </button>
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

          // 마커 정보를 Map에 저장 (ID로 접근 가능하게)
          toiletMarkersMap.current.set(toilet.id, { marker, infoWindow, toilet });

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

  // 특정 화장실에 포커스 (리스트에서 클릭시)
  useEffect(() => {
    if (!focusToiletId || !mapRef.current) return;

    const markerData = toiletMarkersMap.current.get(focusToiletId);
    if (!markerData) {
      console.warn(`화장실 ID ${focusToiletId}에 해당하는 마커를 찾을 수 없습니다.`);
      return;
    }

    const { marker, infoWindow } = markerData;

    // 모든 정보창 닫기
    infoWindowsRef.current.forEach((iw) => iw.close());

    // 해당 마커로 지도 중심 이동 (부드럽게)
    mapRef.current.panTo(marker.getPosition());

    // 줌 레벨 조정 (너무 가깝지 않게)
    setTimeout(() => {
      if (mapRef.current.getZoom() < 16) {
        mapRef.current.setZoom(16);
      }
    }, 300);

    // 정보창 열기 (약간의 딜레이 후 - 지도 이동이 먼저 완료되도록)
    setTimeout(() => {
      infoWindow.open(mapRef.current, marker);
    }, 400);

    console.log(`✅ 화장실 포커스: ${markerData.toilet.name}`);
  }, [focusToiletId]);

  // 리뷰 쓰기 버튼 클릭 핸들러를 전역으로 등록
  useEffect(() => {
    window.handleReviewClick = (toiletId: string) => {
      const markerData = toiletMarkersMap.current.get(toiletId);
      if (markerData && onReviewClick) {
        onReviewClick(markerData.toilet);
      }
    };

    return () => {
      // 컴포넌트 언마운트시 전역 핸들러 제거
      delete window.handleReviewClick;
    };
  }, [onReviewClick]);

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
