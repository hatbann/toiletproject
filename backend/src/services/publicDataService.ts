// 공공데이터 포털 API 연동 서비스
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 서울교통공사 화장실 API 응답 타입 (실제 API 응답 형식)
export interface SeoulSubwayToiletResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: Array<{
          fcltNo?: string;           // 시설번호
          fcltNm?: string;           // 시설명
          lineNm?: string;           // 호선명
          stnCd?: string;            // 역코드
          stnNm?: string;            // 역명
          stnNo?: string;            // 역번호
          crtrYmd?: string;          // 생성일자
          mngNo?: string | null;     // 관리번호
          gateInoutSe?: string;      // 게이트내외구분
          grndUdgdSe?: string;       // 지상지하구분
          vcntEntrcNo?: string;      // 인근출입구번호
          dtlPstn?: string;          // 상세위치
          rstrmInfo?: string;        // 화장실정보
          stnFlr?: string;           // 역층
          whlchrAcsPsbltyYn?: string; // 휠체어접근가능여부
          fcLat?: string;            // 위도 (있을 수도 있음)
          fcLot?: string;            // 경도 (있을 수도 있음)
        }>;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// Naver Geocoding API 응답 타입
interface NaverGeocodingResponse {
  status: string;
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: Array<{
    roadAddress: string;
    jibunAddress: string;
    englishAddress: string;
    x: string; // 경도 (longitude)
    y: string; // 위도 (latitude)
    distance: number;
  }>;
  errorMessage?: string;
}

class PublicDataService {
  private readonly API_KEY = process.env.PUBLIC_DATA_API_KEY || '';
  private readonly NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
  private readonly NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

  // 서울교통공사 화장실 데이터 가져오기 (역명으로 검색 가능)
  async fetchSeoulSubwayToilets(stationName?: string): Promise<SeoulSubwayToiletResponse | null> {
    try {
      if (!this.API_KEY) {
        console.error('❌ 공공데이터 API 키가 설정되지 않았습니다.');
        return null;
      }

      const searchInfo = stationName ? `역명: ${stationName}` : '전체';
      console.log(`📡 서울교통공사 화장실 API 호출 시작... (${searchInfo})`);

      const params: Record<string, string | number> = {
        serviceKey: this.API_KEY,
        pageNo: 1,
        numOfRows: 1000, // 최대 1000개까지 가져오기
        dataType: 'JSON'
      };

      // 역명이 제공된 경우 검색 조건 추가
      if (stationName) {
        params.stnNm = stationName;
      }

      const response = await axios.get<SeoulSubwayToiletResponse>(
        'https://apis.data.go.kr/B553766/facility/getFcRstrm',
        {
          params,
          timeout: 15000 // 15초 타임아웃
        }
      );

      console.log('✅ 서울교통공사 화장실 데이터 조회 성공');
      console.log(`📊 응답 상태: ${response.data.response.header.resultCode} - ${response.data.response.header.resultMsg}`);

      return response.data;

    } catch (error) {
      console.error('❌ 서울교통공사 화장실 데이터 조회 실패:', error);
      if (axios.isAxiosError(error)) {
        console.error('API 응답 오류:', error.response?.data);
        console.error('HTTP 상태:', error.response?.status);
        console.error('요청 URL:', error.config?.url);
      }
      return null;
    }
  }

  // 주소를 좌표로 변환 (Naver Geocoding API 사용)
  async getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (!this.NAVER_CLIENT_ID || !this.NAVER_CLIENT_SECRET) {
        console.warn('⚠️ 네이버 지도 API 키가 설정되지 않아 기본 좌표를 사용합니다.');
        // 서울역 좌표를 기본값으로 반환
        return { lat: 37.5547, lng: 126.9706 };
      }

      const response = await axios.get<NaverGeocodingResponse>('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.NAVER_CLIENT_ID,
          'X-NCP-APIGW-API-KEY': this.NAVER_CLIENT_SECRET
        },
        params: {
          query: address
        },
        timeout: 5000
      });

      if (response.data.status === 'OK' && response.data.addresses && response.data.addresses.length > 0) {
        const addr = response.data.addresses[0];
        return {
          lat: parseFloat(addr.y),
          lng: parseFloat(addr.x)
        };
      }

      console.warn(`⚠️ 주소 좌표 변환 실패: ${address}`);
      if (response.data.errorMessage) {
        console.warn(`   오류 메시지: ${response.data.errorMessage}`);
      }
      return null;

    } catch (error) {
      console.error('❌ 네이버 Geocoding API 오류:', error);
      if (axios.isAxiosError(error)) {
        console.error('   API 응답:', error.response?.data);
        console.error('   HTTP 상태:', error.response?.status);
      }
      return null;
    }
  }

  // 서울교통공사 화장실 데이터를 데이터베이스에 저장
  async saveSubwayToiletsToDatabase(): Promise<{ success: boolean; saved: number; errors: number }> {
    try {
      console.log('🚇 서울교통공사 화장실 데이터 동기화 시작...');

      const apiData = await this.fetchSeoulSubwayToilets();

      if (!apiData || !apiData.response || apiData.response.header.resultCode !== '00') {
        console.error('❌ API 데이터를 가져올 수 없습니다.');
        if (apiData?.response?.header) {
          console.error(`   응답 코드: ${apiData.response.header.resultCode}`);
          console.error(`   응답 메시지: ${apiData.response.header.resultMsg}`);
        }
        return { success: false, saved: 0, errors: 1 };
      }

      const toilets = apiData.response.body.items?.item || [];

      if (toilets.length === 0) {
        console.log('ℹ️ 가져올 화장실 데이터가 없습니다.');
        return { success: true, saved: 0, errors: 0 };
      }

      console.log(`📊 총 ${toilets.length}개의 화장실 데이터를 처리합니다.`);

      let savedCount = 0;
      let errorCount = 0;

      // 배치 처리를 위해 10개씩 나누어 처리
      const batchSize = 10;
      for (let i = 0; i < toilets.length; i += batchSize) {
        const batch = toilets.slice(i, i + batchSize);

        await Promise.all(batch.map(async (toilet) => {
          try {
            // 필수 데이터 확인
            if (!toilet.fcltNm || !toilet.stnNm) {
              console.warn(`⚠️ 필수 데이터 누락: ${JSON.stringify(toilet)}`);
              errorCount++;
              return;
            }

            const name = toilet.fcltNm;
            const address = toilet.dtlPstn || `서울시 ${toilet.stnNm}역`;

            // 이미 존재하는지 확인 (이름과 주소로)
            const existingToilet = await prisma.toilet.findFirst({
              where: {
                name: name,
                type: 'public'
              }
            });

            if (existingToilet) {
              console.log(`⏭️ 이미 존재: ${name}`);
              return;
            }

            // 좌표 확인 (API에서 제공하는 경우)
            let latitude: number;
            let longitude: number;

            if (toilet.fcLat && toilet.fcLot) {
              // API에서 좌표를 제공하는 경우
              latitude = parseFloat(toilet.fcLat);
              longitude = parseFloat(toilet.fcLot);
              console.log(`📍 API 제공 좌표 사용: ${name} (${latitude}, ${longitude})`);
            } else {
              // 좌표가 없는 경우 Geocoding 사용
              const coordinates = await this.getCoordinatesFromAddress(address);

              if (!coordinates) {
                console.warn(`⚠️ 좌표 변환 실패로 건너뜀: ${name}`);
                errorCount++;
                return;
              }

              latitude = coordinates.lat;
              longitude = coordinates.lng;
              console.log(`🗺️ Geocoding 좌표 사용: ${name} (${latitude}, ${longitude})`);
            }

            // 데이터베이스에 저장
            await prisma.toilet.create({
              data: {
                name: name,
                address: address,
                latitude: latitude,
                longitude: longitude,
                type: 'public',
                hasPassword: false, // 공공화장실은 대부분 비밀번호 없음
                isActive: true
              }
            });

            savedCount++;
            console.log(`✅ 저장 완료: ${name}`);

          } catch (error) {
            errorCount++;
            console.error(`❌ 저장 실패 (${toilet.fcltNm || toilet.stnNm}):`, error);
          }
        }));

        // 배치 간 잠시 대기 (API 과부하 방지)
        if (i + batchSize < toilets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`🎉 서울교통공사 화장실 데이터 동기화 완료!`);
      console.log(`📊 저장된 화장실: ${savedCount}개`);
      console.log(`❌ 오류 발생: ${errorCount}개`);

      return {
        success: true,
        saved: savedCount,
        errors: errorCount
      };

    } catch (error) {
      console.error('❌ 서울교통공사 화장실 데이터 동기화 실패:', error);
      return {
        success: false,
        saved: 0,
        errors: 1
      };
    }
  }

  // 모든 공공데이터 동기화 실행
  async syncAllPublicData(): Promise<{
    success: boolean;
    results: Array<{
      source: string;
      saved: number;
      errors: number;
    }>;
  }> {
    console.log('🔄 모든 공공데이터 동기화 시작...');

    const results = [];

    // 1. 서울교통공사 화장실 데이터
    const subwayResult = await this.saveSubwayToiletsToDatabase();
    results.push({
      source: '서울교통공사 지하철 화장실',
      saved: subwayResult.saved,
      errors: subwayResult.errors
    });

    // 향후 다른 공공데이터 API도 여기에 추가 가능
    // 2. 서울시 공공화장실 API
    // 3. 기타 지자체 화장실 API

    const totalSaved = results.reduce((sum, result) => sum + result.saved, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

    console.log('🎯 전체 공공데이터 동기화 완료!');
    console.log(`📊 총 저장된 화장실: ${totalSaved}개`);
    console.log(`❌ 총 오류 발생: ${totalErrors}개`);

    return {
      success: totalErrors < results.length, // 모든 소스에서 오류가 발생하지 않았다면 성공
      results
    };
  }
}

export default new PublicDataService();