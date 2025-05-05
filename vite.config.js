import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If your index.html is at the project root, remove the `root` setting so Vite finds it by default.
  // root: 'src',
  server: {
    port: 3000,
  },
  // If you have static assets in a `public` folder, Vite will serve them automatically.
  // publicDir: 'public',
});
