import { TopicQuestion } from '../data/topics';

interface Props {
  question: TopicQuestion;
  currentIndex: number;
  total: number;
  selected: 'A' | 'B' | null;
  onSelect: (choice: 'A' | 'B') => void;
}

export default function BalanceCard({ question, currentIndex, total, selected, onSelect }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.progress}>
        <div style={styles.progressBar}>
          <div
            style={{ ...styles.progressFill, width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
        <span style={styles.progressText}>{currentIndex + 1} / {total}</span>
      </div>

      <div style={styles.questionWrap}>
        <p style={styles.questionText}>{question.text}</p>
      </div>

      <div style={styles.optionsWrap}>
        <button
          style={{
            ...styles.optionBtn,
            ...(selected === 'A' ? styles.optionSelected : {}),
          }}
          onClick={() => onSelect('A')}
        >
          <span style={styles.optionLabel}>A</span>
          <span style={styles.optionText}>{question.optionA}</span>
        </button>

        <div style={styles.vsWrap}>
          <span style={styles.vs}>VS</span>
        </div>

        <button
          style={{
            ...styles.optionBtn,
            ...(selected === 'B' ? styles.optionSelected : {}),
          }}
          onClick={() => onSelect('B')}
        >
          <span style={styles.optionLabel}>B</span>
          <span style={styles.optionText}>{question.optionB}</span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '0 16px' },
  progress: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#FFC500', borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: { fontSize: 13, color: '#999', whiteSpace: 'nowrap' },
  questionWrap: {
    backgroundColor: '#fff', borderRadius: 20, padding: '28px 24px',
    marginBottom: 20, minHeight: 100, display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  questionText: { fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', lineHeight: 1.5 },
  optionsWrap: { display: 'flex', flexDirection: 'column', gap: 0 },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: '18px 20px',
    border: '2px solid transparent', cursor: 'pointer', textAlign: 'left',
    transition: 'border-color 0.15s, background-color 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  optionSelected: {
    borderColor: '#FFC500',
    backgroundColor: '#FFFBEB',
  },
  optionLabel: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: '#FFC500', color: '#111',
    fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: { fontSize: 15, color: '#222', fontWeight: 500, lineHeight: 1.4 },
  vsWrap: { display: 'flex', justifyContent: 'center', padding: '6px 0' },
  vs: { fontSize: 12, fontWeight: 800, color: '#ccc', letterSpacing: 2 },
};
