import { Link } from 'react-router-dom'
import theme, { floatUp } from '../theme.js'

// 앱 안에서 바로 읽는 기억법 가이드입니다. (저장소의 GUIDE.md와 같은 내용)
// 목업에는 이 화면이 없어서, 나머지 화면과 같은 다크 테마 톤으로 직접 맞췄습니다.
export default function Guide() {
  return (
    <div style={styles.wrap}>
      <Link to="/" style={styles.back}>
        ← 홈으로
      </Link>

      <h1 style={styles.h1}>📖 기억법 가이드</h1>
      <p style={styles.lead}>
        메모리룸은 <b>기억의 궁전(장소법)</b>을 쉽게 쓰도록 만든 앱입니다. 사진(장소) 위에
        <b> 핀(순서 있는 위치)</b>을 찍고, 각 핀에 외울 내용을 <b>생생한 연상</b>으로 붙여두면,
        나중에 그 장소를 머릿속으로 걸으며 순서대로 떠올릴 수 있어요.
      </p>

      <Section title="1. 왜 장소에 기억하나요?">
        <p style={styles.p}>
          뇌는 추상적인 정보(숫자·이름)는 잘 잊지만 <b>공간과 그림</b>은 오래 기억합니다.
          그래서 외울 내용을 "익숙한 장소의 특정 위치"에 그림으로 바꿔 걸어두면 훨씬 잘 붙습니다.
        </p>
      </Section>

      <Section title="2. 메모리룸으로 하는 4단계">
        <ol style={styles.ol}>
          <li>
            <b>장소 고르기</b> — 사진을 올리거나 내장된 <b>예시 장소 10곳</b>에서 고릅니다.
            익숙할수록(우리 집일수록) 강력합니다.
          </li>
          <li>
            <b>핀 찍기(순서 정하기)</b> — 사물들을 <b>일정한 동선</b>(왼→오, 시계방향)으로
            클릭하세요. 번호가 곧 외울 순서입니다.
          </li>
          <li>
            <b>내용 붙이기</b> — 핀을 클릭해 암기 내용과 연상 스토리를 저장합니다.
            (텍스트 또는 🎙️ 음성)
          </li>
          <li>
            <b>복습하기</b> — "🧠 복습 시작하기"로 하나씩 떠올리고 성공/실패를 기록하면
            다음 복습일이 자동 계산됩니다.
          </li>
        </ol>
      </Section>

      <Section title="3. 4가지 기억 기법 (앱의 '암기 기법' 항목)">
        <Technique name="① 숫자변환법 — 숫자를 사물로">
          숫자는 <b>모양·소리가 닮은 사물</b>로 바꿉니다. 0=공/도넛, 1=연필, 2=백조, 3=갈매기,
          4=요트, 5=갈고리, 6=체리, 7=낫, 8=눈사람, 9=풍선.
          <br />
          <span style={styles.ex}>
            예) 2580 → 백조(2)가 갈고리(5)로 눈사람(8)을 낚아 도넛(0) 위에 올린다.
          </span>
        </Technique>
        <Technique name="② 문자변환법 — 글자·이니셜을 사물로">
          자음/알파벳을 대표 사물로. (K=케이크, S=뱀, M=산) 영어 단어·기호에 좋습니다.
          <br />
          <span style={styles.ex}>예) K(칼륨) → 칠판 위에 케이크를 붙여둔다.</span>
        </Technique>
        <Technique name="③ 연상기억법 — 뜻을 그림으로">
          대상의 <b>의미를 생생한 장면</b>으로. 인물·사건·개념에 좋습니다.
          <br />
          <span style={styles.ex}>
            예) 세종대왕=한글창제 → 소파 위 세종대왕이 거대한 붓으로 ㄱㄴㄷ을 쓴다.
          </span>
        </Technique>
        <Technique name="④ 기초결합법 — 항목끼리 엮어 이야기로">
          여러 항목을 <b>하나의 짧은 이야기</b>로 연결. 순서 있는 목록에 강력합니다.
          <br />
          <span style={styles.ex}>예) 우유→빵→계란 : 우유에 빠진 빵을 계란이 구해낸다.</span>
        </Technique>
      </Section>

      <Section title="4. 좋은 연상의 5가지 원칙">
        <ul style={styles.ul}>
          <li>🔍 <b>크게·과장되게</b> — 코끼리만 한 사과</li>
          <li>💥 <b>움직이게</b> — 부수고 튀고 폭발</li>
          <li>🤪 <b>우스꽝/기괴하게</b> — 말이 안 될수록 잘 남음</li>
          <li>👃 <b>감각 총동원</b> — 냄새·소리·촉감까지</li>
          <li>🙋 <b>나와 연결</b> — 1인칭으로 직접 겪기</li>
        </ul>
        <p style={styles.note}>
          ⚠️ 이 앱은 내용을 자동으로 채워주지 않습니다. 연상은 <b>직접 만들수록</b> 더 오래 남아요.
        </p>
      </Section>

      <Section title="5. 복습(간격 반복)">
        <p style={styles.p}>
          결과에 따라 다음 복습일이 정해집니다: 기억 못함/어려움 → <b>1일 뒤</b>, 보통 →{' '}
          <b>3일 뒤</b>, 쉬움 → <b>7일 뒤</b>. <b>📊 학습 통계</b>에서 연속일수·정답률을 확인하며
          꾸준히 이어가세요.
        </p>
      </Section>

      <div style={styles.cta}>
        <Link to="/rooms/new" style={styles.ctaBtn}>
          바로 룸 만들어 보기 →
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  )
}

function Technique({ name, children }) {
  return (
    <div style={styles.tech}>
      <div style={styles.techName}>{name}</div>
      <div style={styles.techBody}>{children}</div>
    </div>
  )
}

const styles = {
  wrap: {
    ...floatUp,
    lineHeight: 1.7,
    paddingBottom: 40,
  },
  back: {
    display: 'inline-block',
    background: 'none',
    border: 'none',
    color: theme.textMuted2,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  h1: { fontSize: 22, margin: '0 0 12px', fontWeight: 800 },
  lead: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    padding: 16,
    fontSize: 14,
    color: theme.textMuted2,
    marginBottom: 8,
  },
  section: { marginTop: 26 },
  h2: {
    fontSize: 16,
    margin: '0 0 10px',
    borderLeft: `4px solid ${theme.accent}`,
    paddingLeft: 10,
    fontWeight: 800,
  },
  p: { fontSize: 14, margin: '0 0 10px', color: theme.textMuted2 },
  ol: { fontSize: 14, paddingLeft: 22, margin: 0, display: 'grid', gap: 8, color: theme.textMuted2 },
  ul: { fontSize: 14, paddingLeft: 22, margin: 0, display: 'grid', gap: 6, listStyle: 'none', color: theme.textMuted2 },
  tech: {
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    padding: '12px 14px',
    marginBottom: 10,
    background: theme.card,
  },
  techName: { fontWeight: 700, marginBottom: 4, fontSize: 14 },
  techBody: { fontSize: 13, color: theme.textMuted2 },
  ex: { display: 'inline-block', marginTop: 6, color: theme.accentSoftText2, fontSize: 12.5 },
  note: {
    marginTop: 10,
    background: theme.dangerBgAlt,
    border: `1px solid ${theme.dangerBorder}`,
    color: theme.dangerText,
    borderRadius: theme.radiusInput,
    padding: '10px 12px',
    fontSize: 13,
  },
  cta: { marginTop: 30, textAlign: 'center' },
  ctaBtn: {
    display: 'inline-block',
    padding: '14px 22px',
    borderRadius: theme.radiusSm,
    background: theme.accent,
    color: theme.accentText,
    fontWeight: 800,
  },
}
