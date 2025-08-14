# babel-plugin-react-source-string

A Babel plugin that adds `data-source` attributes to HTML elements, showing the source line of code from react component.

## Installation

```bash
npm install babel-plugin-react-source-string
# or
yarn add babel-plugin-react-source-string
# or
pnpm add babel-plugin-react-source-string
```

## Usage

### Basic Configuration

Add the plugin to your Babel configuration:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "babel-plugin-react-source-string",
      { libraries: ["@mui/material"], excluded: ["MyComponent", "p", "span"] },
    ],
  ],
};
```

### Plugin Options

- `libraries` (string[]): Array of library names to track. The plugin will add `data-source` attributes to components from these libraries.
- `excluded` (string[]): Array of element names to exclude from processing (case-insensitive).

### Example

**Source (JSX):**

```jsx
import React from "react";
import { Button } from "@mui/material";

function MyComponent() {
  return (
    <div>
      <Button>Click me</Button>
      <span>Some text</span>
    </div>
  );
}
```

**Rendered (HTML):**

```html
<div data-source="src/MyComponent.jsx:6">
  <button data-source="src/MyComponent.jsx:7">Click me</button>
  <span data-source="src/MyComponent.jsx:8">Some text</span>
</div>
```

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. The following commit types will trigger automatic releases:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)

Examples:

```bash
git commit -m "feat: add support for new library"
git commit -m "fix: resolve issue with data-source attribute"
git commit -m "feat!: change plugin configuration format"
```

## License

MIT
