import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTopicById } from '../data/topics';

export default function TopicIntroPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topicId');
  const topic = topicId ? getTopicById(topicId) : null;

  if (!topic) {
    navigate('/');
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.topicBadge}>
        <span style={styles.topicEmoji}>{topic.emoji}</span>
        <span style={styles.topicName}>{topic.name}</span>
      </div>

      <div style={styles.card}>
        <p style={styles.cardTitle}>이렇게 진행돼요</p>

        <div style={styles.stepList}>
          <Step number={1} text="내가 먼저 5개 질문에 답해요" />
          <Step number={2} text="초대 코드를 받아서 친구에게 공유해요" />
          <Step number={3} text="친구도 같은 질문에 답해요" />
          <Step number={4} text="서로 얼마나 일치했는지 케미를 확인해요 🎉" />
        </div>
      </div>

      <div style={styles.hint}>
        💡 답변이 얼마나 같은지에 따라 케미 점수와 등급이 결정돼요
      </div>

      <div style={styles.footer}>
        <button style={styles.startBtn} onClick={() => navigate(`/game?topicId=${topicId}`, { replace: true })}>
          내 답변 먼저 작성하기
        </button>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          돌아가기
        </button>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNum}>{number}</div>
      <p style={styles.stepText}>{text}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', backgroundColor: '#f4f4f4',
    display: 'flex', flexDirection: 'column', padding: '32px 20px 100px',
  },
  topicBadge: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px',
    marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  topicEmoji: { fontSize: 32 },
  topicName: { fontSize: 18, fontWeight: 700, color: '#111' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 20 },
  stepList: { display: 'flex', flexDirection: 'column', gap: 16 },
  step: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    backgroundColor: '#3182F6', color: '#fff',
    fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { fontSize: 15, color: '#333', lineHeight: 1.5, paddingTop: 4 },
  hint: {
    fontSize: 13, color: '#999', textAlign: 'center',
    lineHeight: 1.6, padding: '0 8px',
  },
  footer: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 20px 20px', backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  startBtn: {
    width: '100%', padding: 15, borderRadius: 14, border: 'none',
    backgroundColor: '#3182F6', fontSize: 16, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
  },
  backBtn: {
    width: '100%', padding: 12, borderRadius: 14, border: 'none',
    backgroundColor: 'transparent', fontSize: 14, color: '#999', cursor: 'pointer',
  },
};
