// 브라우저 음성 인식(Web Speech API) 도우미입니다.
// README 원칙("텍스트 또는 음성으로 직접 입력")의 '음성' 부분을 담당합니다.
// 별도 서버/외부 API 없이, 브라우저에 내장된 음성 인식을 사용합니다.
// (Chrome 등에서 동작. 지원하지 않는 브라우저에서는 버튼을 숨깁니다.)

export function isSpeechSupported() {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

// 한 번 듣고, 인식된 문장을 onResult(text)로 돌려줍니다.
// 반환값 stop()을 호출하면 도중에 멈출 수 있습니다.
export function startDictation({ lang = 'ko-KR', onResult, onEnd, onError } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError?.(new Error('이 브라우저는 음성 입력을 지원하지 않습니다.'))
    return () => {}
  }

  const recognition = new SR()
  recognition.lang = lang
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript?.trim()
    if (text) onResult?.(text)
  }
  recognition.onend = () => onEnd?.()
  recognition.onerror = (e) => onError?.(new Error(e.error || '음성 인식 오류'))

  recognition.start()
  return () => recognition.stop()
}
