# babel-plugin-react-source-string

A Babel plugin that adds `data-source` attributes to HTML elements with React components, showing the source line of code.

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
      {
        libraries: ["react", "@mui/material", "antd"], // UI libraries to track
        excluded: ["div", "span", "p"], // HTML elements to exclude
      },
    ],
  ],
};
```

### Plugin Options

- `libraries` (string[]): Array of library names to track. The plugin will add `data-source` attributes to components from these libraries.
- `excluded` (string[]): Array of element names to exclude from processing (case-insensitive).

### Example

**Input:**

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

**Output:**

```jsx
import React from "react";
import { Button } from "@mui/material";

function MyComponent() {
  return (
    <div>
      <Button data-source="src/MyComponent.jsx:6">Click me</Button>
      <span>Some text</span>
    </div>
  );
}
```

## Development

### Build

```bash
pnpm run build
```

### Development Mode

```bash
pnpm run dev
```

## Publishing

This package uses GitHub Actions for automatic publishing. To publish a new version:

1. Update the version in `package.json`
2. Create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The GitHub Action will automatically build and publish to npm

## License

MIT
