# Working on babel-plugin-react-source-string

A Babel plugin that adds `data-source="path:line"` to every JSX element, plus an optional dev overlay (`overlay: true`). It has the same options and output as [vite-plugin-react-source-string](https://github.com/tanchu/vite-plugin-react-source) and [swc-plugin-react-source-string](https://github.com/tanchu/swc-plugin-react-source).

## Layout

- `src/index.ts`: the plugin. Built with `unbuild` into `dist/`.
- `overlay.js`: the overlay runtime, imported into every tagged file when `overlay` is on. **Generated, do not edit by hand** (see below).
- `tests/basic.test.mjs`: tests on Node's built-in runner, against the built `dist/`.

## Commands

```bash
pnpm install
pnpm test        # build, then run the tests
pnpm test:ci     # tests only, against an existing build
```

CI runs the tests against Babel 7, Babel 8 and the newest `@babel/core`.

## Rules

- **`overlay.js` comes from the Vite plugin.** Its source is `src/client.ts` in [vite-plugin-react-source](https://github.com/tanchu/vite-plugin-react-source). Change it there, then regenerate from that repository: `pnpm build && node scripts/gen-overlay.mjs ../babel-plugin-react-source-string/overlay.js`. The file must stay a plain script with no imports or exports, so it loads the same way from ESM and CommonJS.
- **The overlay import goes after directives**, so `"use client"` stays the first statement, and only into ES modules.
- **Options and output stay identical across the three plugins.** A new option or a change to what gets tagged needs the same change in the Vite and SWC plugins, and in the agent skill at [tanchu/react-source-skills](https://github.com/tanchu/react-source-skills).
- **Do not move the source into accessibility attributes** (`title`, `aria-*`). `title` can replace the accessible name and breaks screen readers and role-based tests.
- **Fragments are never tagged** (`<>`, `<Fragment>`, `<React.Fragment>`): React warns about any prop other than `key` and `children`.
- **Commits follow [Conventional Commits](https://www.conventionalcommits.org/).** release-please reads them: `fix:` makes a patch release, `feat:` a minor one, `docs:`, `test:`, `ci:` and `chore:` make none. Merging the release PR publishes to npm, so leave that to the maintainer.
