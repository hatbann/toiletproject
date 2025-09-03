import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Toilet {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "public" | "user";
  hasPassword: boolean;
  rating?: number;
}

interface KakaoMapProps {
  toilets: Toilet[];
  center?: { lat: number; lng: number };
  onToiletClick?: (toilet: Toilet) => void;
}

const KakaoMap: React.FC<KakaoMapProps> = ({ 
  toilets, 
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본 좌표
  onToiletClick 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!window.kakao || !mapContainer.current) return;

    // 지도 초기화
    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);
    mapRef.current = map;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 화장실 마커 추가
    toilets.forEach((toilet) => {
      const markerPosition = new window.kakao.maps.LatLng(toilet.lat, toilet.lng);
      
      // 마커 이미지 설정 (공공/사용자 구분)
      const imageSrc = toilet.type === 'public' 
        ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png';
      
      const imageSize = new window.kakao.maps.Size(24, 35);
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
      });

      marker.setMap(map);
      markersRef.current.push(marker);

      // 인포윈도우 생성
      const infowindowContent = `
        <div style="padding:5px;font-size:12px;width:200px;">
          <strong>${toilet.name}</strong><br/>
          <span style="color:gray;">${toilet.address}</span><br/>
          <span style="color:${toilet.hasPassword ? 'red' : 'green'};">
            ${toilet.hasPassword ? '🔒 비밀번호 필요' : '🔓 자유이용'}
          </span>
          ${toilet.rating ? `<br/><span style="color:orange;">⭐ ${toilet.rating}</span>` : ''}
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({
        content: infowindowContent,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker);
        if (onToiletClick) {
          onToiletClick(toilet);
        }
      });

      // 마커 마우스오버 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(map, marker);
      });

      // 마커 마우스아웃 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
      });
    });

  }, [toilets, center, onToiletClick]);

  // 현재 위치로 이동하는 함수
  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('현재 위치를 가져올 수 없습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
        
        if (mapRef.current) {
          mapRef.current.setCenter(moveLatLng);
          
          // 현재 위치 마커 추가
          const marker = new window.kakao.maps.Marker({
            position: moveLatLng,
          });
          marker.setMap(mapRef.current);
        }
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        alert('위치 정보를 가져올 수 없습니다.');
      }
    );
  };

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-lg"
      />
      <button
        onClick={moveToCurrentLocation}
        className="absolute top-2 right-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-md hover:bg-gray-50 transition-colors"
      >
        📍 현재 위치
      </button>
    </div>
  );
};

export default KakaoMap;
