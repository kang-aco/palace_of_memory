import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 1단계: 개발용 로컬 서버 설정입니다. 특별히 건드릴 부분은 없습니다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
