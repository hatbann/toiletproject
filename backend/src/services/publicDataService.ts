// 공공데이터 포털 API 연동 서비스
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 서울교통공사 화장실 API 응답 타입
interface SeoulSubwayToiletResponse {
  SearchPblToiletBySubwayiNfo: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: Array<{
      STATN_NM: string;        // 역명
      ROUTE: string;           // 호선
      ADRES: string;           // 주소
      TOILET_DTTM: string;     // 화장실 위치정보
      WKDAY_BEGIN_TIME: string; // 평일 시작시간
      WKDAY_END_TIME: string;   // 평일 종료시간
      SATDAY_BEGIN_TIME: string; // 토요일 시작시간
      SATDAY_END_TIME: string;   // 토요일 종료시간
      HDAY_BEGIN_TIME: string;   // 휴일 시작시간
      HDAY_END_TIME: string;     // 휴일 종료시간
      TROBLE_PHONE: string;      // 고장신고 전화번호
    }>;
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

  // 서울교통공사 화장실 데이터 가져오기
  async fetchSeoulSubwayToilets(): Promise<SeoulSubwayToiletResponse | null> {
    try {
      if (!this.API_KEY) {
        console.error('❌ 공공데이터 API 키가 설정되지 않았습니다.');
        return null;
      }

      const response = await axios.get('http://openapi.seoul.go.kr:8088', {
        params: {
          KEY: this.API_KEY,
          TYPE: 'json',
          SERVICE: 'SearchPblToiletBySubwayInfo',
          START_INDEX: 1,
          END_INDEX: 1000 // 최대 1000개까지 가져오기
        },
        timeout: 10000 // 10초 타임아웃
      });

      console.log('✅ 서울교통공사 화장실 데이터 조회 성공');
      return response.data;

    } catch (error) {
      console.error('❌ 서울교통공사 화장실 데이터 조회 실패:', error);
      if (axios.isAxiosError(error)) {
        console.error('API 응답 오류:', error.response?.data);
        console.error('HTTP 상태:', error.response?.status);
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

      if (!apiData || !apiData.SearchPblToiletBySubwayiNfo) {
        console.error('❌ API 데이터를 가져올 수 없습니다.');
        return { success: false, saved: 0, errors: 1 };
      }

      const { row: toilets = [] } = apiData.SearchPblToiletBySubwayiNfo;

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
            const name = `${toilet.STATN_NM}역 ${toilet.ROUTE} 화장실`;
            const address = toilet.ADRES || `서울시 ${toilet.STATN_NM}역`;

            // 이미 존재하는지 확인 (이름과 주소로)
            const existingToilet = await prisma.toilet.findFirst({
              where: {
                name: name,
                address: address,
                type: 'public'
              }
            });

            if (existingToilet) {
              console.log(`⏭️ 이미 존재: ${name}`);
              return;
            }

            // 주소를 좌표로 변환
            const coordinates = await this.getCoordinatesFromAddress(address);

            if (!coordinates) {
              console.warn(`⚠️ 좌표 변환 실패로 건너뜀: ${name}`);
              errorCount++;
              return;
            }

            // 운영시간 정보 생성
            let operatingHours = '';
            if (toilet.WKDAY_BEGIN_TIME && toilet.WKDAY_END_TIME) {
              operatingHours += `평일: ${toilet.WKDAY_BEGIN_TIME}-${toilet.WKDAY_END_TIME}`;
            }
            if (toilet.SATDAY_BEGIN_TIME && toilet.SATDAY_END_TIME) {
              operatingHours += ` / 토요일: ${toilet.SATDAY_BEGIN_TIME}-${toilet.SATDAY_END_TIME}`;
            }
            if (toilet.HDAY_BEGIN_TIME && toilet.HDAY_END_TIME) {
              operatingHours += ` / 휴일: ${toilet.HDAY_BEGIN_TIME}-${toilet.HDAY_END_TIME}`;
            }

            // 데이터베이스에 저장
            await prisma.toilet.create({
              data: {
                name: name,
                address: address,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                type: 'public',
                hasPassword: false, // 공공화장실은 대부분 비밀번호 없음
                isActive: true
              }
            });

            savedCount++;
            console.log(`✅ 저장 완료: ${name}`);

          } catch (error) {
            errorCount++;
            console.error(`❌ 저장 실패 (${toilet.STATN_NM}역):`, error);
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