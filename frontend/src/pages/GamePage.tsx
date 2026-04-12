import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { AnswerItem, CustomQuestion } from '../types';
import { TopicQuestion, getQuestionById, getTopicById, pickRandomQuestions } from '../data/topics';
import BalanceCard from '../components/BalanceCard';
import { useAuth } from '../hooks/useAuth';

const QUESTIONS_PER_GAME = 5;

export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userKey } = useAuth();
  const topicId = searchParams.get('topicId');
  const shortCode = searchParams.get('shortCode'); // B유저 진입 시
  const isCustom = searchParams.get('custom') === 'true';
  const role = shortCode ? 'B' : 'A';

  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, 'A' | 'B'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuestions() {
      try {
        if (role === 'B' && shortCode) {
          const room = await api.getRoom(shortCode);

          if (room.isCustom && room.questionsSnapshot) {
            // 커스텀: 서버에서 질문 내용 받음
            setQuestions(room.questionsSnapshot);
          } else if (!room.isCustom && room.questionIds) {
            // 일반: questionIds → 로컬 데이터 룩업
            const qs = room.questionIds
              .map(id => getQuestionById(id))
              .filter((q): q is TopicQuestion => q !== undefined);
            if (qs.length === 0) throw new Error('질문을 찾을 수 없어요');
            setQuestions(qs);
          } else {
            throw new Error('잘못된 방 데이터입니다');
          }
        } else if (isCustom) {
          const stored = sessionStorage.getItem('customQuestions');
          if (!stored) { navigate('/custom'); return; }
          setQuestions(JSON.parse(stored));
        } else if (topicId) {
          // A: 로컬 데이터에서 랜덤 5개 즉시 추출 — 서버 요청 없음
          const topic = getTopicById(topicId);
          if (!topic) { navigate('/'); return; }
          setQuestions(pickRandomQuestions(topicId, QUESTIONS_PER_GAME));
        } else {
          navigate('/');
        }
      } catch {
        setError('질문을 불러오지 못했어요. 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(choice: 'A' | 'B') {
    setAnswers(prev => new Map(prev).set(questions[currentIndex].id, choice));
  }

  function handleNext() {
    if (!answers.has(questions[currentIndex].id)) return;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      handleSubmit();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const answerItems: AnswerItem[] = questions.map(q => ({
      questionId: q.id,
      choice: answers.get(q.id)!,
    }));

    try {
      if (role === 'A') {
        if (isCustom) {
          const customQuestions: CustomQuestion[] = questions.map(q => ({
            id: q.id,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
          }));
          const { shortCode: code } = await api.createCustomRoom({ customQuestions, answers: answerItems, userKey: userKey ?? undefined });
          sessionStorage.removeItem('customQuestions');
          navigate(`/invite/${code}`, { replace: true });
        } else {
          const { shortCode: code } = await api.createRoom({
            topicId: topicId!,
            questionIds: questions.map(q => q.id),
            answers: answerItems,
            userKey: userKey ?? undefined,
          });
          navigate(`/invite/${code}`, { replace: true });
        }
      } else {
        await api.submitBAnswers(shortCode!, answerItems, userKey ?? undefined);
        navigate(`/waiting/${shortCode}?role=B`, { replace: true });
      }
    } catch {
      setError('제출 중 오류가 발생했어요. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  }

  if (loading) return <CenterScreen emoji="⏳" message="질문 불러오는 중..." />;
  if (error) return <CenterScreen emoji="😅" message={error} onAction={() => navigate('/')} actionLabel="돌아가기" />;
  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const selected = answers.get(currentQuestion.id) ?? null;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button
          style={{ ...styles.prevBtn, visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
          onClick={handlePrev}
        >
          ‹
        </button>
        <span style={styles.roleText}>
          {role === 'A' ? '내 답변 먼저 작성하기' : '친구 초대에 답하기'}
        </span>
        <div style={{ width: 36 }} />
      </div>

      <BalanceCard
        question={currentQuestion}
        currentIndex={currentIndex}
        total={questions.length}
        selected={selected}
        onSelect={handleSelect}
        onAutoAdvance={handleNext}
      />

      {submitting && (
        <div style={styles.submittingBar}>제출 중...</div>
      )}
    </div>
  );
}

function CenterScreen({
  emoji, message, onAction, actionLabel,
}: {
  emoji: string; message: string; onAction?: () => void; actionLabel?: string;
}) {
  return (
    <div style={styles.center}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <p style={{ color: '#444', fontSize: 15, marginBottom: 16 }}>{message}</p>
      {onAction && (
        <button style={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', display: 'flex', flexDirection: 'column' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0',
  },
  prevBtn: {
    width: 36, height: 36, borderRadius: 10, border: '1.5px solid #eee',
    backgroundColor: '#fff', fontSize: 20, color: '#555', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  roleText: { fontSize: 13, fontWeight: 600, color: '#888' },
  submittingBar: {
    textAlign: 'center', padding: '16px', fontSize: 14,
    color: '#999', marginTop: 'auto',
  },
  center: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center',
  },
  actionBtn: {
    padding: '12px 28px', borderRadius: 12, border: 'none',
    backgroundColor: '#FFC500', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
};
