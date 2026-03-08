import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          origem: path.resolve(__dirname, 'origem.html'),
          nordeste: path.resolve(__dirname, 'nordeste.html'),
          comoFunciona: path.resolve(__dirname, 'como-funciona.html'),
          xilogravura: path.resolve(__dirname, 'xilogravura.html'),
          demonstracao: path.resolve(__dirname, 'demonstracao.html'),
          capas: path.resolve(__dirname, 'capas.html'),
          autores: path.resolve(__dirname, 'autores.html'),
          quiz: path.resolve(__dirname, 'quiz.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
