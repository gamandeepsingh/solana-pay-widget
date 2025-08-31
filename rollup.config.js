import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      exportConditions: ['browser'],
    }),
    commonjs({
      include: 'node_modules/**',
      transformMixedEsModules: true,
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      declaration: true,
      declarationDir: 'dist',
    }),
    postcss({
      extract: true,
      minimize: true,
    }),
  ],
  external: [
    'react',
    'react-dom',
    // Node.js built-ins - let consuming app handle them
    'crypto',
    'stream',
    'util',
    'process',
    'path',
    'fs',
    'os',
    'events',
    'querystring',
    'url',
    'http',
    'https',
    'zlib',
    'assert',
    'constants'
  ],
};
