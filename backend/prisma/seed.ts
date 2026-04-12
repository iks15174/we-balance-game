import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 시드 데이터는 Admin API 관리용 레퍼런스입니다.
// 실제 게임 문제는 frontend/src/data/topics.ts 의 하드코딩 데이터를 사용합니다.
const TOPICS = [
  {
    name: '우당탕탕 일상',
    emoji: '🏠',
    description: '소소하지만 중요한 일상 속 선택들',
    order: 1,
    questions: [
      { text: '주말 아침, 나는?', optionA: '10시 이전에 일어난다', optionB: '12시 넘어서 일어난다', order: 1 },
      { text: '청소 스타일은?', optionA: '더러워지면 바로바로 청소', optionB: '한 번에 몰아서 대청소', order: 2 },
      { text: '밥 먹을 때?', optionA: 'TV나 유튜브 틀어놓고', optionB: '조용히 먹는 게 좋다', order: 3 },
      { text: '쇼핑할 때 나는?', optionA: '계획 세우고 필요한 것만', optionB: '가서 눈에 띄는 거 사기', order: 4 },
      { text: '잠들기 전 마지막으로?', optionA: '핸드폰 보다가 스르르', optionB: '눈 감으면 바로 잠든다', order: 5 },
      { text: '배달 vs 직접 요리?', optionA: '배달 시켜 먹기', optionB: '직접 해먹기', order: 6 },
      { text: '약속 시간 전 나는?', optionA: '10분 일찍 도착해 있음', optionB: '딱 맞춰 or 조금 늦음', order: 7 },
      { text: '영화 볼 때 나는?', optionA: '미리 리뷰 보고 선택', optionB: '포스터 보고 즉흥 선택', order: 8 },
      { text: '스트레스 받으면?', optionA: '혼자 조용히 있고 싶다', optionB: '누군가와 얘기하고 싶다', order: 9 },
      { text: '카톡 답장은?', optionA: '바로바로 답장한다', optionB: '나중에 몰아서 답장', order: 10 },
    ],
  },
  {
    name: '여행 스타일',
    emoji: '✈️',
    description: '같이 여행 가도 될까? 스타일 체크',
    order: 2,
    questions: [
      { text: '여행 계획은?', optionA: '분 단위 일정 짜기', optionB: '대충 목적지만 정하기', order: 1 },
      { text: '여행지 선택 기준?', optionA: '유명한 관광지 방문', optionB: '현지인 숨은 맛집 탐방', order: 2 },
      { text: '숙소 스타일은?', optionA: '깨끗하고 편한 호텔', optionB: '감성 있는 게스트하우스', order: 3 },
      { text: '아침 일정은?', optionA: '일찍 일어나 관광 시작', optionB: '느긋하게 브런치부터', order: 4 },
      { text: '기념품은?', optionA: '꼭 사야 직성이 풀림', optionB: '사진으로 충분하다', order: 5 },
      { text: '여행 중 찍는 사진은?', optionA: '명소 인증샷 위주', optionB: '일상적인 순간 감성샷', order: 6 },
      { text: '이동 중에는?', optionA: '차창 밖 보며 멍 때리기', optionB: '음악/팟캐스트 듣기', order: 7 },
      { text: '여행 인원은?', optionA: '여럿이 우르르 가기', optionB: '혼자 또는 소수 정예', order: 8 },
      { text: '현지 음식은?', optionA: '뭐든 도전해 본다', optionB: '한식 찾게 된다', order: 9 },
      { text: '여행 마지막 날은?', optionA: '마지막까지 빡빡한 일정', optionB: '여유롭게 쉬다가 귀국', order: 10 },
    ],
  },
  {
    name: '직장 / 학교',
    emoji: '💼',
    description: '같이 일하거나 공부하면 어떨까?',
    order: 3,
    questions: [
      { text: '마감 기한이 있을 때?', optionA: '미리미리 끝내놓는다', optionB: '마감 직전에 집중 폭발', order: 1 },
      { text: '점심은?', optionA: '항상 같은 조와 함께', optionB: '그때그때 다른 사람과', order: 2 },
      { text: '모르는 것이 생기면?', optionA: '혼자 찾아보고 해결', optionB: '바로 물어보고 해결', order: 3 },
      { text: '회의할 때 나는?', optionA: '적극적으로 의견 낸다', optionB: '경청하고 꼭 필요할 때만 발언', order: 4 },
      { text: '칭찬을 받으면?', optionA: '뿌듯하고 더 열심히 하게 됨', optionB: '쑥스럽고 부담스럽다', order: 5 },
      { text: '업무 중 실수하면?', optionA: '바로 솔직하게 보고', optionB: '먼저 수습하고 나서 보고', order: 6 },
      { text: '팀 과제 스타일은?', optionA: '내가 주도해서 이끌기', optionB: '각자 역할 분담 후 합치기', order: 7 },
      { text: '퇴근(하교) 후 회식은?', optionA: '적극 참여, 분위기 메이커', optionB: '한두 잔만 하고 빠지기', order: 8 },
      { text: '책상/자리 정리는?', optionA: '항상 깔끔하게 유지', optionB: '내 나름의 카오스 시스템', order: 9 },
      { text: '일이 너무 많을 때는?', optionA: '야근해서라도 끝낸다', optionB: '우선순위 정하고 나머지는 내일', order: 10 },
    ],
  },
  {
    name: '만약에 (가치관)',
    emoji: '🤔',
    description: '서로의 가치관을 엿보는 상상 질문들',
    order: 4,
    questions: [
      { text: '만약 로또 1등 당첨되면?', optionA: '전부 다 아껴서 투자', optionB: '하고 싶었던 거 다 해본다', order: 1 },
      { text: '다시 태어날 수 있다면?', optionA: '나 자신으로 다시 살기', optionB: '완전 다른 사람으로 살기', order: 2 },
      { text: '만약 타임머신이 생긴다면?', optionA: '과거로 돌아가 후회 수정', optionB: '미래로 가서 결과 확인', order: 3 },
      { text: '무인도에 하나만 가져갈 수 있다면?', optionA: '스마트폰 (배터리 무한)', optionB: '맛있는 음식 무제한', order: 4 },
      { text: '내 삶에서 더 중요한 건?', optionA: '안정적이고 편안한 삶', optionB: '짜릿하고 모험적인 삶', order: 5 },
      { text: '1년간 SNS를 끊는 대가로 1억?', optionA: '당연히 끊지', optionB: '못 끊을 것 같다', order: 6 },
      { text: '친구가 많은 것 vs 깊은 친구 한 명?', optionA: '다양한 친구 많은 게 좋다', optionB: '진짜 한 명이면 충분하다', order: 7 },
      { text: '내 단점을 솔직하게 말해주는 친구 vs 늘 좋게만 말해주는 친구?', optionA: '솔직하게 말해주는 친구', optionB: '항상 내 편 들어주는 친구', order: 8 },
      { text: '좋아하는 일 but 월급 200 vs 별로지만 월급 500?', optionA: '좋아하는 일 월급 200', optionB: '별로지만 월급 500', order: 9 },
      { text: '10년 후 나는?', optionA: '지금보다 훨씬 성공해 있을 것', optionB: '지금처럼 평범하게 잘 살 것', order: 10 },
    ],
  },
  {
    name: '음식 / 맛집',
    emoji: '🍽️',
    description: '우리의 입맛과 식습관이 통할까?',
    order: 5,
    questions: [
      { text: '치킨 vs 피자?', optionA: '치킨', optionB: '피자', order: 1 },
      { text: '매운 음식은?', optionA: '매울수록 좋다', optionB: '못 먹거나 약하게만 먹는다', order: 2 },
      { text: '혼자 밥 먹는 건?', optionA: '전혀 상관없다', optionB: '혼밥은 좀 외롭다', order: 3 },
      { text: '식사 후 디저트는?', optionA: '디저트는 필수 코스', optionB: '배부르면 됐지, 디저트는 패스', order: 4 },
      { text: '국밥 vs 파스타?', optionA: '따뜻한 국밥', optionB: '분위기 있는 파스타', order: 5 },
      { text: '음식 사진 찍는 거?', optionA: '먹기 전에 꼭 찍는다', optionB: '사진보다 먹는 게 먼저', order: 6 },
      { text: '맛집 웨이팅은?', optionA: '1시간도 기다릴 수 있다', optionB: '웨이팅 있으면 다른 곳 간다', order: 7 },
      { text: '새로운 음식 도전은?', optionA: '낯선 음식도 일단 먹어본다', optionB: '검증된 익숙한 메뉴 선택', order: 8 },
      { text: '식사 속도는?', optionA: '빨리 먹는 편', optionB: '천천히 먹는 편', order: 9 },
      { text: '고기 굽기는?', optionA: '내가 직접 굽는다', optionB: '누군가 구워주면 더 맛있다', order: 10 },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const topicData of TOPICS) {
    const { questions, ...topicFields } = topicData;

    const topic = await prisma.topic.upsert({
      where: { id: `seed-topic-${topicFields.order}` },
      update: { ...topicFields },
      create: { id: `seed-topic-${topicFields.order}`, ...topicFields },
    });

    for (const q of questions) {
      await prisma.question.upsert({
        where: { id: `seed-q-${topicFields.order}-${q.order}` },
        update: { ...q, topicId: topic.id },
        create: { id: `seed-q-${topicFields.order}-${q.order}`, ...q, topicId: topic.id },
      });
    }

    console.log(`✓ Seeded topic: ${topicFields.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
