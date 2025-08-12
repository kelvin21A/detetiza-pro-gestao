import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    // Melhorar performance de build
    minify: mode === 'production' ? 'esbuild' : false,
    // Aumentar timeout para evitar erros de rede
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    // Adicionar configurações para melhorar a confiabilidade do build
    emptyOutDir: true,
    reportCompressedSize: false, // Reduzir overhead de build
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
        }
      }
    }
  },
  plugins: [
    react({
      // Melhorar performance de desenvolvimento
      devTarget: 'es2022',
      // Melhorar performance de produção
      tsDecorators: true,
      plugins: [['@swc/plugin-styled-components', {}]]
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Otimizações para PWA
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Configurações para lidar com problemas de rede
    esbuildOptions: {
      logLevel: 'error',
      logLimit: 0,
      tsconfigRaw: {
        compilerOptions: {
          target: 'es2020',
          useDefineForClassFields: true
        }
      }
    }
  },
  // Configurações específicas para cada ambiente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __DEV_MODE__: mode !== 'production',
  }
}));
