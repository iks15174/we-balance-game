// 밸런스 게임 전체 문제 데이터 (FE 하드코딩)
// 각 주제당 목표: 100문항. 현재: 약 20~25문항 (지속 확장 필요)
// 문항 ID는 변경 불가 (룸 DB에 저장됨)

export interface TopicQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
}

export interface TopicData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  questions: TopicQuestion[];
}

export const TOPICS_DATA: TopicData[] = [
  {
    id: 'daily',
    name: '우당탕탕 일상',
    emoji: '🏠',
    description: '소소하지만 중요한 일상 속 선택들',
    questions: [
      { id: 'daily-q001', text: '주말 아침, 나는?', optionA: '10시 이전에 일어난다', optionB: '12시 넘어서 일어난다' },
      { id: 'daily-q002', text: '청소 스타일은?', optionA: '더러워지면 바로바로 청소', optionB: '한 번에 몰아서 대청소' },
      { id: 'daily-q003', text: '밥 먹을 때?', optionA: 'TV나 유튜브 틀어놓고', optionB: '조용히 먹는 게 좋다' },
      { id: 'daily-q004', text: '쇼핑할 때 나는?', optionA: '계획 세우고 필요한 것만', optionB: '가서 눈에 띄는 거 사기' },
      { id: 'daily-q005', text: '잠들기 전 마지막으로?', optionA: '핸드폰 보다가 스르르', optionB: '눈 감으면 바로 잠든다' },
      { id: 'daily-q006', text: '배달 vs 직접 요리?', optionA: '배달 시켜 먹기', optionB: '직접 해먹기' },
      { id: 'daily-q007', text: '약속 시간 전 나는?', optionA: '10분 일찍 도착해 있음', optionB: '딱 맞춰 or 조금 늦음' },
      { id: 'daily-q008', text: '영화 볼 때 나는?', optionA: '미리 리뷰 보고 선택', optionB: '포스터 보고 즉흥 선택' },
      { id: 'daily-q009', text: '스트레스 받으면?', optionA: '혼자 조용히 있고 싶다', optionB: '누군가와 얘기하고 싶다' },
      { id: 'daily-q010', text: '카톡 답장은?', optionA: '바로바로 답장한다', optionB: '나중에 몰아서 답장' },
      { id: 'daily-q011', text: '운동 스타일은?', optionA: '꾸준히 매일 조금씩', optionB: '가끔 한 번에 몰아서' },
      { id: 'daily-q012', text: '주말에 더 좋은 건?', optionA: '집에서 쉬기', optionB: '밖에 나가서 뭔가 하기' },
      { id: 'daily-q013', text: '지갑 관리는?', optionA: '가계부 쓰고 계획적으로', optionB: '쓰고 싶을 때 씀' },
      { id: 'daily-q014', text: '옷 고를 때?', optionA: '전날 미리 준비해둔다', optionB: '당일 아침에 즉흥으로' },
      { id: 'daily-q015', text: '약속을 갑자기 취소하면?', optionA: '솔직히 많이 당황스럽다', optionB: '오히려 여유 생겨서 좋다' },
      { id: 'daily-q016', text: '이동할 때 선호하는 교통수단?', optionA: '대중교통 (지하철/버스)', optionB: '택시/카풀' },
      { id: 'daily-q017', text: '방 온도는?', optionA: '조금 쌀쌀하게 유지', optionB: '따뜻하게 유지' },
      { id: 'daily-q018', text: '새로운 물건 살 때?', optionA: '여러 제품 비교 후 최적 선택', optionB: '마음에 들면 바로 구매' },
      { id: 'daily-q019', text: '친구와 연락 빈도는?', optionA: '매일 연락하는 친구가 있다', optionB: '생각날 때만 가끔 연락' },
      { id: 'daily-q020', text: '알람은?', optionA: '1~2개만 딱 맞춰 설정', optionB: '5분 간격으로 10개 이상' },
      { id: 'daily-q021', text: '음악은 언제 듣나?', optionA: '이동 중, 운동 중 등 특정 상황만', optionB: '집에서도 항상 틀어놓는다' },
      { id: 'daily-q022', text: '책상/책장 정리는?', optionA: '카테고리별로 정돈', optionB: '내 나름의 카오스 시스템' },
      { id: 'daily-q023', text: '생일을 챙기는 편?', optionA: '지인 생일 다 기억하고 챙긴다', optionB: '내 생일도 잊어버린다' },
      { id: 'daily-q024', text: '집에 있을 때 나는?', optionA: '편한 홈웨어 항상 입고 있음', optionB: '집에서도 어느 정도 차려입음' },
      { id: 'daily-q025', text: '소비할 때 기준은?', optionA: '가성비 (싸고 좋은 것)', optionB: '가심비 (마음이 만족하는 것)' },
    ],
  },
  {
    id: 'travel',
    name: '여행 스타일',
    emoji: '✈️',
    description: '같이 여행 가도 될까? 스타일 체크',
    questions: [
      { id: 'travel-q001', text: '여행 계획은?', optionA: '분 단위 일정 짜기', optionB: '대충 목적지만 정하기' },
      { id: 'travel-q002', text: '여행지 선택 기준?', optionA: '유명한 관광지 방문', optionB: '현지인 숨은 맛집 탐방' },
      { id: 'travel-q003', text: '숙소 스타일은?', optionA: '깨끗하고 편한 호텔', optionB: '감성 있는 게스트하우스' },
      { id: 'travel-q004', text: '아침 일정은?', optionA: '일찍 일어나 관광 시작', optionB: '느긋하게 브런치부터' },
      { id: 'travel-q005', text: '기념품은?', optionA: '꼭 사야 직성이 풀림', optionB: '사진으로 충분하다' },
      { id: 'travel-q006', text: '여행 중 찍는 사진은?', optionA: '명소 인증샷 위주', optionB: '일상적인 순간 감성샷' },
      { id: 'travel-q007', text: '이동 중에는?', optionA: '차창 밖 보며 멍 때리기', optionB: '음악/팟캐스트 듣기' },
      { id: 'travel-q008', text: '여행 인원은?', optionA: '여럿이 우르르 가기', optionB: '혼자 또는 소수 정예' },
      { id: 'travel-q009', text: '현지 음식은?', optionA: '뭐든 도전해 본다', optionB: '한식 찾게 된다' },
      { id: 'travel-q010', text: '여행 마지막 날은?', optionA: '마지막까지 빡빡한 일정', optionB: '여유롭게 쉬다가 귀국' },
      { id: 'travel-q011', text: '숙소 체크인 시간은?', optionA: '체크인 시작 시간 딱 맞춰 도착', optionB: '늦은 밤 체크인도 괜찮다' },
      { id: 'travel-q012', text: '여행 예산 관리는?', optionA: '예산 미리 정하고 지킨다', optionB: '현장에서 그때그때 판단' },
      { id: 'travel-q013', text: '여행지 날씨가 안 좋으면?', optionA: '실내 관광지로 계획 변경', optionB: '비 맞으면서 그냥 다닌다' },
      { id: 'travel-q014', text: '여행 전 짐은?', optionA: '며칠 전부터 꼼꼼히 챙김', optionB: '하루 전날 30분 만에 끝냄' },
      { id: 'travel-q015', text: '맛집 탐방 방식은?', optionA: '웨이팅 있어도 유명한 곳 간다', optionB: '웨이팅 없는 주변 맛집 찾기' },
      { id: 'travel-q016', text: '여행 SNS 공유는?', optionA: '실시간으로 올린다', optionB: '돌아와서 정리해서 올림' },
      { id: 'travel-q017', text: '낯선 현지인과 대화는?', optionA: '적극적으로 먼저 말 건다', optionB: '필요한 경우에만 소통' },
      { id: 'travel-q018', text: '여행 중 쇼핑은?', optionA: '지역 특산물/기념품 위주', optionB: '아울렛/면세점 쇼핑 위주' },
      { id: 'travel-q019', text: '국내 vs 해외 여행?', optionA: '국내 숨은 여행지 탐방', optionB: '해외 낯선 곳 가기' },
      { id: 'travel-q020', text: '여행지에서 길을 잃으면?', optionA: '바로 지도 앱 켜서 해결', optionB: '그냥 걸으면서 구경' },
      { id: 'travel-q021', text: '비행기 좌석은?', optionA: '창가 자리 (뷰 감상)', optionB: '통로 자리 (자유로운 이동)' },
      { id: 'travel-q022', text: '여행 동행자와 하루종일 붙어 다니는 건?', optionA: '함께해야 진짜 여행이지', optionB: '중간중간 각자 시간 필요' },
      { id: 'travel-q023', text: '숙소는 어디서 고르나?', optionA: '리뷰 꼼꼼히 읽고 결정', optionB: '가격 보고 바로 예약' },
    ],
  },
  {
    id: 'work',
    name: '직장 / 학교',
    emoji: '💼',
    description: '같이 일하거나 공부하면 어떨까?',
    questions: [
      { id: 'work-q001', text: '마감 기한이 있을 때?', optionA: '미리미리 끝내놓는다', optionB: '마감 직전에 집중 폭발' },
      { id: 'work-q002', text: '점심은?', optionA: '항상 같은 조와 함께', optionB: '그때그때 다른 사람과' },
      { id: 'work-q003', text: '모르는 것이 생기면?', optionA: '혼자 찾아보고 해결', optionB: '바로 물어보고 해결' },
      { id: 'work-q004', text: '회의할 때 나는?', optionA: '적극적으로 의견 낸다', optionB: '경청하고 꼭 필요할 때만 발언' },
      { id: 'work-q005', text: '칭찬을 받으면?', optionA: '뿌듯하고 더 열심히 하게 됨', optionB: '쑥스럽고 부담스럽다' },
      { id: 'work-q006', text: '업무 중 실수하면?', optionA: '바로 솔직하게 보고', optionB: '먼저 수습하고 나서 보고' },
      { id: 'work-q007', text: '팀 과제 스타일은?', optionA: '내가 주도해서 이끌기', optionB: '각자 역할 분담 후 합치기' },
      { id: 'work-q008', text: '퇴근(하교) 후 회식은?', optionA: '적극 참여, 분위기 메이커', optionB: '한두 잔만 하고 빠지기' },
      { id: 'work-q009', text: '책상/자리 정리는?', optionA: '항상 깔끔하게 유지', optionB: '내 나름의 카오스 시스템' },
      { id: 'work-q010', text: '일이 너무 많을 때는?', optionA: '야근해서라도 끝낸다', optionB: '우선순위 정하고 나머지는 내일' },
      { id: 'work-q011', text: '이메일/보고서 스타일은?', optionA: '짧고 핵심만 간결하게', optionB: '배경부터 결론까지 상세하게' },
      { id: 'work-q012', text: '신입/후배가 들어오면?', optionA: '먼저 말 걸고 챙겨준다', optionB: '어색해서 상대방이 말 걸길 기다림' },
      { id: 'work-q013', text: '피드백을 받으면?', optionA: '비판도 성장 기회로 받아들임', optionB: '일단 속상하고 나중에 받아들임' },
      { id: 'work-q014', text: '집중이 잘 되는 환경은?', optionA: '조용한 곳 (도서관/개인 공간)', optionB: '약간 소음 있는 곳 (카페 등)' },
      { id: 'work-q015', text: '성과 평가에서 중요한 건?', optionA: '과정이 중요하다', optionB: '결과가 중요하다' },
      { id: 'work-q016', text: '점심시간 활용은?', optionA: '식사 후 잠깐 낮잠', optionB: '식사 후 산책이나 다른 활동' },
      { id: 'work-q017', text: '재택 vs 출근?', optionA: '재택이 훨씬 좋다', optionB: '출근해야 집중이 된다' },
      { id: 'work-q018', text: '아이디어 회의할 때?', optionA: '즉흥적으로 많이 던지는 편', optionB: '생각 정리 후 엄선해서 말하는 편' },
      { id: 'work-q019', text: '상사/선생님 스타일 선호?', optionA: '가깝고 편하게 지내는 스타일', optionB: '적당히 거리 두는 프로 스타일' },
      { id: 'work-q020', text: '발표할 때?', optionA: '떨려도 앞에 나가는 게 낫다', optionB: '뒤에서 서포트 역할이 편하다' },
      { id: 'work-q021', text: '업무 메신저 읽으면?', optionA: '바로 답장한다', optionB: '일단 읽고 나중에 답장' },
      { id: 'work-q022', text: '프로젝트 초반에?', optionA: '큰 그림부터 잡는다', optionB: '일단 할 수 있는 것부터 시작' },
    ],
  },
  {
    id: 'values',
    name: '만약에 (가치관)',
    emoji: '🤔',
    description: '서로의 가치관을 엿보는 상상 질문들',
    questions: [
      { id: 'values-q001', text: '만약 로또 1등 당첨되면?', optionA: '전부 다 아껴서 투자', optionB: '하고 싶었던 거 다 해본다' },
      { id: 'values-q002', text: '다시 태어날 수 있다면?', optionA: '나 자신으로 다시 살기', optionB: '완전 다른 사람으로 살기' },
      { id: 'values-q003', text: '만약 타임머신이 생긴다면?', optionA: '과거로 돌아가 후회 수정', optionB: '미래로 가서 결과 확인' },
      { id: 'values-q004', text: '무인도에 하나만 가져갈 수 있다면?', optionA: '스마트폰 (배터리 무한)', optionB: '맛있는 음식 무제한' },
      { id: 'values-q005', text: '내 삶에서 더 중요한 건?', optionA: '안정적이고 편안한 삶', optionB: '짜릿하고 모험적인 삶' },
      { id: 'values-q006', text: '1년간 SNS를 끊는 대가로 1억?', optionA: '당연히 끊지', optionB: '못 끊을 것 같다' },
      { id: 'values-q007', text: '친구가 많은 것 vs 깊은 친구 한 명?', optionA: '다양한 친구 많은 게 좋다', optionB: '진짜 한 명이면 충분하다' },
      { id: 'values-q008', text: '솔직한 친구 vs 항상 내 편 드는 친구?', optionA: '솔직하게 말해주는 친구', optionB: '항상 내 편 들어주는 친구' },
      { id: 'values-q009', text: '좋아하는 일 월급 200 vs 별로지만 월급 500?', optionA: '좋아하는 일 월급 200', optionB: '별로지만 월급 500' },
      { id: 'values-q010', text: '10년 후 나는?', optionA: '지금보다 훨씬 성공해 있을 것', optionB: '지금처럼 평범하게 잘 살 것' },
      { id: 'values-q011', text: '갑자기 유명인이 된다면?', optionA: '적극적으로 활동하고 싶다', optionB: '부담스러워서 숨고 싶다' },
      { id: 'values-q012', text: '외모 vs 능력 중 하나만 갖출 수 있다면?', optionA: '외모 (자신감 업)', optionB: '능력 (실력으로 인정받기)' },
      { id: 'values-q013', text: '실패할 수도 있는 꿈 vs 안전한 현실?', optionA: '꿈을 향해 도전한다', optionB: '현실적 선택이 맞다' },
      { id: 'values-q014', text: '기억을 지울 수 있다면?', optionA: '지우고 싶은 기억이 있다', optionB: '나쁜 기억도 내 일부, 지우고 싶지 않다' },
      { id: 'values-q015', text: '공정함 vs 효율성?', optionA: '모두에게 공평해야 한다', optionB: '결과가 좋으면 과정은 유연해도 됨' },
      { id: 'values-q016', text: '칭찬과 비판 중 더 필요한 건?', optionA: '칭찬 (동기부여)', optionB: '비판 (성장)' },
      { id: 'values-q017', text: '10억 받는 대신 5년을 잃는다면?', optionA: '받겠다', optionB: '안 받겠다' },
      { id: 'values-q018', text: '현재의 행복 vs 미래의 성공?', optionA: '지금 행복한 게 중요하다', optionB: '나중을 위해 지금 희생할 수 있다' },
      { id: 'values-q019', text: '부자지만 외로운 삶 vs 가난하지만 사랑받는 삶?', optionA: '부자지만 외로운 삶', optionB: '가난하지만 사랑받는 삶' },
      { id: 'values-q020', text: '나에게 더 중요한 것은?', optionA: '남들에게 인정받는 것', optionB: '스스로 만족하는 것' },
      { id: 'values-q021', text: '이미 결정된 운명이 있다면?', optionA: '믿는다, 흐름에 맡기겠다', optionB: '안 믿는다, 내가 만들어간다' },
      { id: 'values-q022', text: '모든 사람에게 사랑받기 vs 소수에게 깊이 사랑받기?', optionA: '모두에게 사랑받기', optionB: '소수에게 깊이 사랑받기' },
    ],
  },
  {
    id: 'food',
    name: '음식 / 맛집',
    emoji: '🍽️',
    description: '우리의 입맛과 식습관이 통할까?',
    questions: [
      { id: 'food-q001', text: '치킨 vs 피자?', optionA: '치킨', optionB: '피자' },
      { id: 'food-q002', text: '매운 음식은?', optionA: '매울수록 좋다', optionB: '못 먹거나 약하게만 먹는다' },
      { id: 'food-q003', text: '혼자 밥 먹는 건?', optionA: '전혀 상관없다', optionB: '혼밥은 좀 외롭다' },
      { id: 'food-q004', text: '식사 후 디저트는?', optionA: '디저트는 필수 코스', optionB: '배부르면 됐지, 디저트는 패스' },
      { id: 'food-q005', text: '국밥 vs 파스타?', optionA: '따뜻한 국밥', optionB: '분위기 있는 파스타' },
      { id: 'food-q006', text: '음식 사진 찍는 거?', optionA: '먹기 전에 꼭 찍는다', optionB: '사진보다 먹는 게 먼저' },
      { id: 'food-q007', text: '맛집 웨이팅은?', optionA: '1시간도 기다릴 수 있다', optionB: '웨이팅 있으면 다른 곳 간다' },
      { id: 'food-q008', text: '새로운 음식 도전은?', optionA: '낯선 음식도 일단 먹어본다', optionB: '검증된 익숙한 메뉴 선택' },
      { id: 'food-q009', text: '식사 속도는?', optionA: '빨리 먹는 편', optionB: '천천히 먹는 편' },
      { id: 'food-q010', text: '고기 굽기는?', optionA: '내가 직접 굽는다', optionB: '누군가 구워주면 더 맛있다' },
      { id: 'food-q011', text: '편의점 음식은?', optionA: '꽤 자주 먹는다', optionB: '거의 안 먹는다' },
      { id: 'food-q012', text: '술자리 안주는?', optionA: '치킨/튀김류', optionB: '과일/채소류' },
      { id: 'food-q013', text: '아침밥은?', optionA: '꼭 챙겨 먹는다', optionB: '아침은 잘 안 먹는다' },
      { id: 'food-q014', text: '짜장면 vs 짬뽕?', optionA: '짜장면', optionB: '짬뽕' },
      { id: 'food-q015', text: '배달음식 메뉴 고를 때?', optionA: '먹고 싶은 거 끝까지 주문', optionB: '빨리 결정, 아무거나 OK' },
      { id: 'food-q016', text: '건강식 vs 맛있는 음식?', optionA: '건강이 먼저다', optionB: '맛있으면 장땡이다' },
      { id: 'food-q017', text: '밥 vs 면?', optionA: '밥이 들어가야 식사한 느낌', optionB: '면 류도 충분히 식사다' },
      { id: 'food-q018', text: '카페인은?', optionA: '커피 없으면 못 산다', optionB: '커피 별로 안 마신다' },
      { id: 'food-q019', text: '단 음식(디저트/음료)은?', optionA: '달달한 거 좋아한다', optionB: '단 거 잘 못 먹는다' },
      { id: 'food-q020', text: '라면 끓이기?', optionA: '봉지 라면이 진리', optionB: '냄비 라면이 진리' },
      { id: 'food-q021', text: '뷔페에서 나는?', optionA: '다양하게 조금씩 맛본다', optionB: '좋아하는 것만 실컷 먹는다' },
      { id: 'food-q022', text: '배고플 때 vs 배부를 때 쇼핑?', optionA: '배고플 때 장 보면 다 사고 싶음', optionB: '배고파도 필요한 것만 산다' },
      { id: 'food-q023', text: '같이 밥 먹을 때 메뉴 결정은?', optionA: '내가 먼저 의견 낸다', optionB: '상대방이 정해주길 기다린다' },
      { id: 'food-q024', text: '음식 남기는 건?', optionA: '배불러도 다 먹어야 함', optionB: '배부르면 남긴다' },
      { id: 'food-q025', text: '야식은?', optionA: '밤에 뭔가 꼭 먹어야 함', optionB: '저녁 먹으면 야식은 안 먹음' },
    ],
  },
];

// 주제 ID로 빠른 룩업
const topicMap = new Map(TOPICS_DATA.map(t => [t.id, t]));

// 질문 ID로 빠른 룩업 (전체 주제 통합)
const questionMap = new Map(
  TOPICS_DATA.flatMap(t => t.questions.map(q => [q.id, q]))
);

export function getTopicById(id: string): TopicData | undefined {
  return topicMap.get(id);
}

export function getQuestionById(id: string): TopicQuestion | undefined {
  return questionMap.get(id);
}

/** 주제에서 count개 랜덤 추출 */
export function pickRandomQuestions(topicId: string, count = 5): TopicQuestion[] {
  const topic = topicMap.get(topicId);
  if (!topic) return [];
  const shuffled = [...topic.questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
