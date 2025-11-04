// 서울교통공사 API 테스트 스크립트
const axios = require('axios');

const API_KEY = '348c124f7f3d087130fc13246e99ae406eb245dabd4cd1db304653176c51dbf3';

async function testAPI() {
  try {
    console.log('📡 API 호출 시작...');
    console.log('API Key:', API_KEY);

    // 방법 1: 기본 파라미터
    console.log('\n=== 방법 1: 기본 파라미터 ===');
    try {
      const url1 = 'https://apis.data.go.kr/B553766/facility/getFcRstrm';
      const response1 = await axios.get(url1, {
        params: {
          serviceKey: API_KEY,
          pageNo: 1,
          numOfRows: 10,
          _type: 'json'
        }
      });
      console.log('✅ 성공!');
      console.log(JSON.stringify(response1.data, null, 2));
    } catch (error) {
      console.log('❌ 실패:', error.response?.status, error.response?.data);
    }

    // 방법 2: 디코딩된 키 사용
    console.log('\n=== 방법 2: 디코딩된 키 사용 ===');
    try {
      const decodedKey = decodeURIComponent(API_KEY);
      const url2 = `https://apis.data.go.kr/B553766/facility/getFcRstrm?serviceKey=${decodedKey}&pageNo=1&numOfRows=10&_type=json`;
      const response2 = await axios.get(url2);
      console.log('✅ 성공!');
      console.log(JSON.stringify(response2.data, null, 2));
    } catch (error) {
      console.log('❌ 실패:', error.response?.status, error.response?.data);
    }

    // 방법 3: XML 응답
    console.log('\n=== 방법 3: XML 응답 ===');
    try {
      const url3 = 'https://apis.data.go.kr/B553766/facility/getFcRstrm';
      const response3 = await axios.get(url3, {
        params: {
          serviceKey: API_KEY,
          pageNo: 1,
          numOfRows: 10
        }
      });
      console.log('✅ 성공!');
      console.log(response3.data);
    } catch (error) {
      console.log('❌ 실패:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('\n❌ 전체 실패!');
    console.error('에러 메시지:', error.message);
  }
}

testAPI();
