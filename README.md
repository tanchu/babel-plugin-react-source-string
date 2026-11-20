# babel-plugin-react-source-string

Babel plugin that adds `data-source="path:line"` attributes to **every JSX element** for debugging — HTML tags, React components, icons, anything.

Same options and output as [swc-plugin-react-source-string](https://github.com/tanchu/swc-plugin-react-source) (Next.js, Rspack)
and [vite-plugin-react-source-string](https://github.com/tanchu/vite-plugin-react-source) (Vite).

## Installation

```bash
npm install -D babel-plugin-react-source-string
# or
pnpm add -D babel-plugin-react-source-string
```

## Usage

```js
// babel.config.js
module.exports = {
  plugins: [
    ["babel-plugin-react-source-string", { excluded: ["Fragment", "Slot"] }],
  ],
};
```

**Tip:** You probably only want this in development:

```js
// babel.config.js
module.exports = (api) => ({
  plugins: [
    ...(api.env("development")
      ? [["babel-plugin-react-source-string", { excluded: ["Fragment"] }]]
      : []),
  ],
});
```

## Compatibility

| Plugin | Babel (`@babel/core`) | Node.js |
| ------ | --------------------- | ------- |
| 2.x    | 7.x, 8.x              | as required by your Babel version |
| 1.x    | 7.x                   | as required by Babel 7 |

The supported range is declared in `peerDependencies`, so npm and pnpm warn on install when your Babel
version is outside it, and the plugin calls Babel's `api.assertVersion()`, so an unsupported Babel fails
with a clear error instead of producing wrong output. CI runs the tests against Babel 7, Babel 8 and the
newest `@babel/core` on every pull request and every Monday; a new Babel major is added to the table and
to `peerDependencies` once the tests pass on it.

## Plugin options

| Option     | Type       | Default        | Description                                                                 |
| ---------- | ---------- | -------------- | --------------------------------------------------------------------------- |
| `excluded` | `string[]` | `[]`           | Component/element names to skip (case-insensitive). For `<UI.Button>` the name is `Button`. |
| `root`     | `string`   | Babel's `cwd`  | Project root for relative paths. An empty string keeps paths absolute.      |

## How it works

The plugin adds a `data-source` attribute to **every** JSX opening element — both HTML tags (`<div>`, `<span>`)
and React components (`<Dialog>`, `<Pencil>`, `<Link>`). Elements listed in `excluded` are skipped,
and elements that already have a `data-source` attribute are left untouched. Fragments (`<>`) are never tagged.

The attribute value is `relative/path/to/file.jsx:line`, where `line` is the line of the element's opening `<`,
making it easy to locate any DOM node back to its source from DevTools. Components show the attribute in the DOM
when they pass extra props down to an element.

### Before

```jsx
// src/components/Example.jsx
<div className="wrapper">
  <Pencil size={16} />
  <Dialog open={isOpen}>
    <DialogContent>Hello</DialogContent>
  </Dialog>
</div>
```

### After

```jsx
<div className="wrapper" data-source="src/components/Example.jsx:2">
  <Pencil size={16} data-source="src/components/Example.jsx:3" />
  <Dialog open={isOpen} data-source="src/components/Example.jsx:4">
    <DialogContent data-source="src/components/Example.jsx:5">Hello</DialogContent>
  </Dialog>
</div>
```

## Migrating from 1.x

- Every JSX element is tagged now, not only HTML tags and components imported from `libraries`.
- The `libraries` option is removed. To skip specific elements, list them in `excluded`.
- New `root` option; paths stay relative to Babel's `cwd` by default, as before.

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. The following commit types will trigger automatic releases:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)

## License

MIT
