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
    sourcemap: false, // Desativar sourcemaps em produção para reduzir tamanho
    // Melhorar performance de build
    minify: mode === 'production' ? 'esbuild' : false,
    // Aumentar timeout para evitar erros de rede
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1500, // Aumentar limite de aviso
    // Adicionar configurações para melhorar a confiabilidade do build
    emptyOutDir: true,
    reportCompressedSize: false, // Reduzir overhead de build
    // Adicionar configuração para evitar erros de memória
    target: 'es2015',
    cssCodeSplit: true, // Separar CSS para melhor caching
    modulePreload: false, // Desativar preload para reduzir overhead
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Estratégia de chunking mais eficiente
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('lucide') || id.includes('framer-motion') || id.includes('date-fns')) {
              return 'vendor-ui';
            }
            return 'vendor'; // todos os outros node_modules
          }
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
      // Configuração simplificada sem plugins adicionais
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
    include: ['react', 'react-dom', 'react-router-dom', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
    exclude: [], // Não excluir nenhuma dependência da otimização
    // Configurações para lidar com problemas de rede
    esbuildOptions: {
      logLevel: 'error',
      logLimit: 0,
      logOverride: {
        'this-is-undefined-in-esm': 'silent'
      },
      target: 'es2020', // Garantir compatibilidade com navegadores modernos
      supported: {
        'top-level-await': true // Suporte para top-level await
      },
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
