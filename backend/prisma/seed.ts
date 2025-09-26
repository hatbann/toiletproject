// 데이터베이스에 테스트 데이터를 삽입하는 파일
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 데이터베이스에 테스트 데이터를 삽입합니다...')

  // 테스트 사용자 생성
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password_here', // 실제로는 bcrypt로 암호화해야 함
      name: '테스트 사용자',
      role: 'user',
    },
  })

  console.log('👤 테스트 사용자 생성:', testUser.name)

  // 강남역 근처 화장실 데이터
  const toilets = [
    {
      name: '강남역 공공화장실',
      address: '서울시 강남구 강남대로 지하',
      latitude: 37.4979,
      longitude: 127.0276,
      type: 'public',
      hasPassword: false,
      creatorId: testUser.id,
    },
    {
      name: '스타벅스 강남점',
      address: '서울시 강남구 테헤란로 123',
      latitude: 37.4985,
      longitude: 127.0285,
      type: 'user',
      hasPassword: true,
      passwordHint: '카페 이용 고객용',
      creatorId: testUser.id,
    },
    {
      name: 'CGV 강남점',
      address: '서울시 강남구 강남대로 456',
      latitude: 37.4990,
      longitude: 127.0270,
      type: 'user',
      hasPassword: false,
      creatorId: testUser.id,
    },
    {
      name: '홍대입구역 화장실',
      address: '서울시 마포구 홍대입구역',
      latitude: 37.5566,
      longitude: 126.9229,
      type: 'public',
      hasPassword: false,
      creatorId: testUser.id,
    },
  ]

  // 화장실 데이터 삽입
  for (const toiletData of toilets) {
    const toilet = await prisma.toilet.create({
      data: toiletData,
    })

    console.log('🚽 화장실 생성:', toilet.name)

    // 각 화장실에 임의의 별점 추가
    await prisma.rating.create({
      data: {
        rating: Math.floor(Math.random() * 2) + 4, // 4-5점 사이
        userId: testUser.id,
        toiletId: toilet.id,
      },
    })
  }

  console.log('✨ 테스트 데이터 삽입 완료!')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })