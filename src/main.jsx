import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// React 18의 표준 진입 코드입니다.
// BrowserRouter로 감싸두면, 나중에(2단계 이후) 화면이 여러 개로 늘어나도
// 주소(URL)에 따라 다른 화면을 보여줄 수 있습니다. (예: /rooms, /rooms/1 등)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
