import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores:['.next/**','.next-flags/**','node_modules/**','artifacts/**','test-results/**','next-env.d.ts'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { files:['src/**/*.{ts,tsx}'],rules:{'no-console':'error','no-alert':'error','no-eval':'error','@typescript-eslint/no-unused-vars':['error',{args:'none',caughtErrors:'none',varsIgnorePattern:'^_',ignoreRestSiblings:true}],'@typescript-eslint/no-unused-expressions':['error',{allowShortCircuit:true,allowTernary:true}]} },
);
