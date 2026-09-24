import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['test/frontend/**/*.test.ts'], testTimeout: 5000 } });
