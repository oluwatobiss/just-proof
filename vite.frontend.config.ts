import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// This build cannot enable the operational route, regardless of public environment settings.
export default defineConfig({ plugins: [react()], define: { 'import.meta.env.VITE_ENABLE_DEPLOY_ROUTE': 'false' }, build: { target: 'es2022', outDir: 'dist' } });
