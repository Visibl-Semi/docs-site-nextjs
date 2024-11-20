import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'nextra-theme-docs',
  entry: ['src/index.tsx'],
  format: 'esm',
  dts: true,
  external: [
    'react',
    'react-dom',
    'framer-motion',
    'lucide-react',
    'nextra'
  ],
  outExtension: () => ({ js: '.js' })
})
