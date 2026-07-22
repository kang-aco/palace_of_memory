import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import NewRoom from './pages/NewRoom.jsx'
import RoomDetail from './pages/RoomDetail.jsx'
import Review from './pages/Review.jsx'
import Stats from './pages/Stats.jsx'
import Guide from './pages/Guide.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './auth/AuthContext.jsx'

// 화면 목록
//  /                 → 홈(룸 목록 + 새 룸 만들기 버튼)
//  /rooms/new        → 사진 업로드 + 핀 찍기 화면
//  /rooms/:id        → 저장된 룸(사진 + 핀 + 암기 내용) 보기/편집
//  /rooms/:id/review → 복습 화면
//  /stats            → 학습 통계 대시보드
//  /guide            → 기억법 가이드
//
// 로그인하지 않았으면(어떤 주소든) 로그인 화면만 보여줍니다.
export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80, fontFamily: 'system-ui' }}>⏳ 불러오는 중...</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rooms/new" element={<NewRoom />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/rooms/:id/review" element={<Review />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/guide" element={<Guide />} />
    </Routes>
  )
}
