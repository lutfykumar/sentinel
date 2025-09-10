import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    css: {
        postcss: {
            plugins: [],
        },
        // Suppress browser-specific CSS property warnings
        preprocessorOptions: {
            css: {
                charset: false,
            },
        },
    },
    build: {
        // Suppress chunk size warnings for large dependencies
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split large dependencies into separate chunks
                    'country-data': ['./resources/js/utils/countryMapping.ts'],
                    'charts': ['recharts'],
                    'ui': ['lucide-react'],
                },
            },
        },
    },
});
