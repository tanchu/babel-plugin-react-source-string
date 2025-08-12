import { transform } from '@babel/core';
import reactSourceString from '../dist/index.mjs';
import {relative} from "path";

// Вспомогательная функция для тестирования трансформации без пресетов
function transformCode(code, libraries = ['react'], excluded = []) {
  const result = transform(code, {
    filename: '/test/file.jsx',
    cwd: '/',
    presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
    plugins: [
      [(reactSourceString([],[])), { libraries, excluded }]
    ]
  });
  
  return result?.code;
}

describe('babel-plugin-react-source-string', () => {
  describe('basic functionality', () => {
    it('should add data-source attribute to lowercase HTML elements', () => {
      const input = `
        function TestComponent() {
          return <div>Hello World</div>;
        }
      `;
      const output = transformCode(input);
      
      expect(output).toContain('"data-source\": "test/file.jsx:3"');
    });
  });

});
