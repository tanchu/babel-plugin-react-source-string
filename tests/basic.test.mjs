import { transform } from '@babel/core';
import reactSourceString from '../dist/index.mjs';

function transformCode(code, options = {libraries: [], excluded : []}) {
  const result = transform(code, {
    filename: '/test/file.jsx',
    cwd: '/',
    presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
    plugins: [[reactSourceString, { libraries: options.libraries, excluded: options.excluded }]],
  });
  return result?.code;
}

describe('babel-plugin-react-source-string', () => {
  describe('basic functionality', () => {
    it('should add data-source attribute', () => {
      const input = `
        import React from "react";
        export function MyComponent() {
            return (
                <div>
                    <span>Some text</span>
                </div>
            );
        }
      `;
      const output = transformCode(input);

      expect(output).toContain('"data-source\": "test/file.jsx:5"');
      expect(output).toContain('"data-source\": "test/file.jsx:6"');
    });
    it('should add data-source attribute to @mui Component', () => {
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
      const output = transformCode(input, {libraries: ['@mui/material']});

      expect(output).toContain('"data-source\": "test/file.jsx:8"');
    });
    it('should not add data-source attribute to button tag', () => {
      const input = `
        import React from "react";
        export function MyComponent() {
            return (
                <div>
                    <button>Click me</button>
                    <span>Some text</span>
                </div>
            );
        }
      `;
      const output = transformCode(input, {excluded: ['button']});

      expect(output).toContain('"data-source\": "test/file.jsx:5"');
      expect(output).toContain('"data-source\": "test/file.jsx:7"');
    });
  });
});
