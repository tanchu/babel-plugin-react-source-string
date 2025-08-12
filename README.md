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
const reactSourceCodePlugin = require('babel-plugin-react-source-string');

module.exports = {
  plugins: [
    [
      reactSourceCodePlugin(['@mui/material'], ['MyComponent', 'p', 'span']),
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

```html
<div data-source="src/MyComponent.jsx:6">
  <button>Click me</button>
  <span data-source="src/MyComponent.jsx:8">Some text</span>
</div>
  );
}
```

## License

MIT
