// toilets API 테스트
const axios = require('axios');

async function testToiletsAPI() {
  try {
    console.log('📡 /api/toilets 호출 중...\n');

    const response = await axios.get('http://localhost:3001/api/toilets');

    console.log('✅ API 호출 성공!');
    console.log('\n=== 응답 상태 ===');
    console.log('HTTP 상태:', response.status);
    console.log('Success:', response.data.success);
    console.log('Count:', response.data.count);

    console.log('\n=== 데이터 샘플 ===');
    if (response.data.data && response.data.data.length > 0) {
      console.log(`총 ${response.data.data.length}개의 화장실 데이터`);
      console.log('\n첫 번째 화장실:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
    } else {
      console.log('⚠️ 데이터가 비어있습니다.');
    }

  } catch (error) {
    console.error('❌ API 호출 실패!');
    if (error.response) {
      console.error('HTTP 상태:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('요청 전송 실패:', error.message);
      console.error('서버가 실행 중인지 확인하세요 (http://localhost:3001)');
    } else {
      console.error('에러:', error.message);
    }
  }
}

testToiletsAPI();
