import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 🔥 Telefon + diğer cihazlar bağlanabilsin diye
  server: {
    host: true,          // 0.0.0.0 üzerinde dinle
    port: 5173,          // frontend portu
    strictPort: true     // port doluysa değiştirme
  }
})
