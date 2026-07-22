// 공용 디자인 토큰입니다. (다크 · 게임화 테마)
// 모든 페이지는 여기서 색/반경/여백 값을 가져다 씁니다.
// 나중에 팔레트를 바꾸고 싶으면(예: accentColor를 보라/청록/빨강/초록 중 선택) 이 파일만 고치면 됩니다.
const theme = {
  // 배경/표면
  bg: 'oklch(0.16 0.028 264)',
  card: 'oklch(0.21 0.026 264)',
  cardAlt: 'oklch(0.18 0.024 264)', // input, textarea 배경
  border: 'oklch(0.3 0.025 264)',
  borderSubtle: 'oklch(0.29 0.024 264)',

  // 텍스트
  text: 'oklch(0.96 0.008 264)',
  textMuted: 'oklch(0.6 0.02 264)',
  textMuted2: 'oklch(0.65 0.02 264)',
  textMuted3: 'oklch(0.55 0.02 264)',
  textFaint: 'oklch(0.5 0.02 264)',

  // 포인트(보라) 색
  accent: 'oklch(0.68 0.19 292)',
  accentEnd: 'oklch(0.6 0.19 300)',
  accentSoftBg: 'oklch(0.24 0.05 292)',
  accentSoftBorder: 'oklch(0.32 0.05 292)',
  accentSoftText: 'oklch(0.7 0.03 292)',
  accentSoftText2: 'oklch(0.85 0.05 292)',
  accentText: 'oklch(0.12 0 0)', // 포인트색 위에 올라가는 진한 텍스트
  accentGlow: 'oklch(0.68 0.19 292 / 0.25)',

  // 성공(초록)
  success: 'oklch(0.7 0.17 152)',
  successBg: 'oklch(0.25 0.1 152)',
  successBgAlt: 'oklch(0.26 0.1 152)',
  successBorder: 'oklch(0.55 0.15 152)',
  successText: 'oklch(0.88 0.1 152)',
  successDarkText: 'oklch(0.1 0.02 152)',

  // 경고(주황)
  warning: 'oklch(0.78 0.15 75)',
  warningBg: 'oklch(0.3 0.08 70)',
  warningBorder: 'oklch(0.55 0.13 70)',
  warningText: 'oklch(0.88 0.1 70)',

  // 위험/미입력(빨강)
  danger: 'oklch(0.66 0.19 18)',
  dangerBg: 'oklch(0.3 0.1 20)',
  dangerBgAlt: 'oklch(0.28 0.09 20)',
  dangerBorder: 'oklch(0.5 0.15 20)',
  dangerText: 'oklch(0.85 0.1 20)',

  // 기타
  progressTrack: 'oklch(0.28 0.02 264)',
  neutralBar: 'oklch(0.4 0.03 264)',

  // 반경
  radiusXl: 20,
  radiusLg: 18,
  radiusMd: 14,
  radiusSm: 12,
  radiusInput: 10,
  radiusPill: 20,

  // 레이아웃
  maxWidth: 480,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

export default theme

// 화면이 마운트될 때 살짝 떠오르며 나타나는 공통 애니메이션 스타일
export const floatUp = { animation: 'floatUp 0.35s ease' }
