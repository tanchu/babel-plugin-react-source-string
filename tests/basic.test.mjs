import { transform } from '@babel/core';
import reactSourceString from '../dist/index.mjs';

function transformCode(code, libraries = ['@mui/material'], excluded = []) {
  const result = transform(code, {
    filename: '/test/file.jsx',
    cwd: '/',
    presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
    plugins: [[reactSourceString, { libraries, excluded }]],
  });

  return result?.code;
}

describe('babel-plugin-react-source-string', () => {
  describe('basic functionality', () => {
    it('should add data-source attribute to lowercase HTML elements', () => {
      const input = `
        import React from "react";
        import { Button } from "@mui/material";

        export function MyComponent() {
            return (
                <div>
                    <Button>Click me</Button>
                    <span>Some text</span>
                </div>
            );
        }
      `;
      const output = transformCode(input);

      expect(output).toContain('"data-source\": "test/file.jsx:7"');
      expect(output).toContain('"data-source\": "test/file.jsx:8"');
      expect(output).toContain('"data-source\": "test/file.jsx:9"');
    });
  });
});
