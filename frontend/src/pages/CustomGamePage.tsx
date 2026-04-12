import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CustomQuestion {
  text: string;
  optionA: string;
  optionB: string;
}

export default function CustomGamePage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<CustomQuestion[]>([
    { text: '', optionA: '', optionB: '' },
    { text: '', optionA: '', optionB: '' },
    { text: '', optionA: '', optionB: '' },
  ]);

  function updateQuestion(index: number, field: keyof CustomQuestion, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function addQuestion() {
    if (questions.length >= 20) return;
    setQuestions((prev) => [...prev, { text: '', optionA: '', optionB: '' }]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNext() {
    const valid = questions.filter((q) => q.text.trim() && q.optionA.trim() && q.optionB.trim());
    if (valid.length === 0) {
      alert('질문을 1개 이상 입력해 주세요.');
      return;
    }
    // 커스텀 질문을 sessionStorage에 임시 저장하고 게임 페이지로 이동 (id 필드 포함)
    const withIds = valid.map((q, i) => ({ ...q, id: `custom-${i + 1}` }));
    sessionStorage.setItem('customQuestions', JSON.stringify(withIds));
    navigate('/game?custom=true');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>우리만의 밸런스 게임</h2>
        <p style={styles.subtitle}>질문과 선택지를 직접 만들어보세요</p>
      </div>

      <div style={styles.list}>
        {questions.map((q, i) => (
          <div key={i} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNum}>Q{i + 1}</span>
              {questions.length > 1 && (
                <button style={styles.removeBtn} onClick={() => removeQuestion(i)}>✕</button>
              )}
            </div>
            <input
              style={styles.input}
              placeholder="질문을 입력하세요"
              value={q.text}
              onChange={(e) => updateQuestion(i, 'text', e.target.value)}
            />
            <div style={styles.optionRow}>
              <input
                style={{ ...styles.input, ...styles.optionInput }}
                placeholder="선택지 A"
                value={q.optionA}
                onChange={(e) => updateQuestion(i, 'optionA', e.target.value)}
              />
              <span style={styles.vs}>VS</span>
              <input
                style={{ ...styles.input, ...styles.optionInput }}
                placeholder="선택지 B"
                value={q.optionB}
                onChange={(e) => updateQuestion(i, 'optionB', e.target.value)}
              />
            </div>
          </div>
        ))}

        {questions.length < 20 && (
          <button style={styles.addBtn} onClick={addQuestion}>
            + 질문 추가 ({questions.length}/20)
          </button>
        )}
      </div>

      <div style={styles.footer}>
        <button style={styles.nextBtn} onClick={handleNext}>
          게임 시작하기
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 100 },
  header: { backgroundColor: '#fff', padding: '24px 20px 20px', borderBottom: '1px solid #f0f0f0' },
  title: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  list: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  questionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    border: '1.5px solid #f0f0f0',
  },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNum: { fontSize: 13, fontWeight: 700, color: '#FFC500' },
  removeBtn: { fontSize: 16, color: '#ccc', background: 'none', border: 'none', cursor: 'pointer' },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #eee', fontSize: 14, color: '#111',
    outline: 'none', marginBottom: 8,
  },
  optionRow: { display: 'flex', gap: 8, alignItems: 'center' },
  optionInput: { flex: 1, marginBottom: 0 },
  vs: { fontSize: 12, fontWeight: 700, color: '#999', flexShrink: 0 },
  addBtn: {
    width: '100%', padding: 14, borderRadius: 14,
    border: '1.5px dashed #ddd', backgroundColor: 'transparent',
    fontSize: 14, color: '#999', cursor: 'pointer',
  },
  footer: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 16px', backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  nextBtn: {
    width: '100%', padding: 16, borderRadius: 14,
    backgroundColor: '#FFC500', border: 'none',
    fontSize: 16, fontWeight: 700, color: '#111', cursor: 'pointer',
  },
};
