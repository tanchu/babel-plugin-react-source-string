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
    ["babel-plugin-react-source-string", { excluded: ["Slot"] }],
  ],
};
```

**Tip:** You probably only want this in development:

```js
// babel.config.js
module.exports = (api) => ({
  plugins: [
    ...(api.env("development")
      ? [["babel-plugin-react-source-string", { excluded: ["Slot"] }]]
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
| `libraries` | `string[]` | — (tag all)   | Tag only components imported from these packages or their subpaths (`@mui/material/Button` matches `@mui/material`); HTML elements are always tagged. |
| `preferCallSite` | `boolean` | `false` | Put the attribute before spread props, so a `data-source` passed in from the parent wins: wrapper components point to where they are used. See [Call site or wrapper](#call-site-or-wrapper-prefercallsite). |

## How it works

The plugin adds a `data-source` attribute to **every** JSX opening element — both HTML tags (`<div>`, `<span>`)
and React components (`<Dialog>`, `<Pencil>`, `<Link>`). Elements listed in `excluded` are skipped;
with `libraries` set, only components imported from those packages are tagged; elements that already have
a `data-source` attribute are left untouched. Fragments are never tagged: `<>`, `<Fragment>` and `<React.Fragment>` accept only `key` and `children`, and React warns about any other prop.

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

## Call site or wrapper: `preferCallSite`

By default the attribute points to the JSX in your code that renders the DOM node. With wrapper components
that is the wrapper's own file:

```jsx
// src/components/MyButton.jsx
export function MyButton(props) {
  return <Button variant="contained" {...props} />;   // line 2
}

// src/pages/Checkout.jsx
<MyButton onClick={pay}>Pay</MyButton>                // line 42
```

Both elements are tagged. `<MyButton>` gets `data-source="src/pages/Checkout.jsx:42"` and passes it down through
`{...props}`, but inside the wrapper the plugin adds its own attribute *after* the spread, so it overrides the one
from the page. The DOM shows `src/components/MyButton.jsx:2`.

With `preferCallSite: true` the plugin puts its attribute *before* spread props, so a value coming from the parent
wins and the DOM shows `src/pages/Checkout.jsx:42`:

```js
// babel.config.js
module.exports = {
  plugins: [["babel-plugin-react-source-string", { preferCallSite: true }]],
};
```

- Elements without spread props are tagged exactly as before.
- With several wrappers that all spread their props (`Page` → `Toolbar` → `MyButton` → `Button`), the outermost call site wins.
- A wrapper that does not pass its props on to the DOM element (picks `className`, `onClick` explicitly) keeps pointing to itself: the value from the call site never reaches the DOM.

**When it helps**

- **Design systems and UI kits.** A shared `<MyButton>` or `<Card>` is used hundreds of times. The default only tells you
  "this is MyButton"; the call site tells you which screen and which line rendered *this* button.
- **Bug reports and QA.** Copy the attribute of a broken element from DevTools and you land in the page code that
  configures it — its props, text and handlers — instead of the shared component.
- **AI coding agents.** Point an agent at an element on the page and it edits that usage (say, the label on the checkout
  page) rather than changing a wrapper that the whole app depends on.

Keep the default when you are working on the wrappers themselves: then you want to land in the wrapper's file.

## Migrating from 1.x

- Without `libraries`, every JSX element is tagged now, not only HTML tags.
- With `libraries`, the 1.x behavior stays: HTML tags plus components imported from those packages.
  Subpath imports (`@mui/material/Button`) and namespace imports (`<UI.Button>` with `import * as UI`) count too.
- New `root` option; paths stay relative to Babel's `cwd` by default, as before.

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. The following commit types will trigger automatic releases:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)

## License

MIT
