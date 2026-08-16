import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const base = env.VITE_BASE_PATH || './';

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      target: 'es2019',
      sourcemap: false,
      manifest: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'icons-vendor': ['lucide-react'],
            'capacitor-vendor': [
              '@capacitor/core',
              '@capacitor/camera',
              '@capacitor/haptics',
              '@capacitor/status-bar',
              '@capacitor-community/admob'
            ]
          }
        }
      }
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    }
  };
});
