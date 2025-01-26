import { defineConfig } from 'vite';    
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    plugins: [glsl()],
    build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
            input: 'src/main.ts',
            output: {
                entryFileNames: 'main.js',
            },
        },
    },
});