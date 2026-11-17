import { cpSync, mkdirSync } from 'node:fs';
cpSync(new URL('../assets', import.meta.url), new URL('../dist/assets', import.meta.url), { recursive: true });
mkdirSync(new URL('../dist/licenses', import.meta.url), { recursive: true });
cpSync(new URL('../src/components/REACT_BITS_LICENSE.md', import.meta.url), new URL('../dist/licenses/react-bits.txt', import.meta.url));
