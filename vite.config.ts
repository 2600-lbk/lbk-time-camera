import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'geojson',
      transform(code, id) {
        if (!id.endsWith('.geojson')) return
        return `export default ${code}`
      },
    },
  ],
  base: '/lbk-time-camera/',
  optimizeDeps: {
    exclude: ['tmp'],
  },
})
