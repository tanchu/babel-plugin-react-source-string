import { defineBuildConfig } from 'unbuild';

// Explicit entries: `overlay.js` in `exports` is a ready-made plain script, not something to build.
export default defineBuildConfig({
    entries: ['src/index'],
    declaration: true,
    rollup: { emitCJS: true },
});
