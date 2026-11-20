import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { transformSync, version } from '@babel/core';
import reactSourceString, { relativePath, stripVirtualPrefix } from '../dist/index.mjs';

const require = createRequire(import.meta.url);

const t = (code, { filename = '/proj/src/App.jsx', cwd = '/proj', ...opts } = {}) =>
    transformSync(code, {
        filename,
        cwd,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['jsx'] },
        plugins: [[reactSourceString, opts]],
    })?.code;

describe(`babel-plugin-react-source-string on @babel/core ${version}`, () => {
    it('tags HTML elements and components with path:line', () => {
        const out = t(`export const A = () => (\n  <div className="w">\n    <Pencil size={16} />\n  </div>\n);`);
        assert.match(out, /<div className="w" data-source="src\/App.jsx:2">/);
        assert.match(out, /<Pencil size=\{16\} data-source="src\/App.jsx:3" \/>/);
    });

    it('tags member and namespaced names', () => {
        const out = t(`const a = <main><UI.Button /><svg:rect /></main>;`);
        assert.match(out, /<main data-source="src\/App.jsx:1">/);
        assert.match(out, /<UI.Button data-source="src\/App.jsx:1" \/>/);
        assert.match(out, /<svg:rect data-source="src\/App.jsx:1" \/>/);
    });

    it('skips excluded names case-insensitively (member expression uses the last part)', () => {
        const out = t(`const a = <><Fragment><React.fragment><slot /></React.fragment></Fragment><b /></>;`, {
            excluded: ['Fragment', 'Slot'],
        });
        assert.ok(out.includes('<Fragment><React.fragment><slot /></React.fragment></Fragment>'));
        assert.ok(out.includes('<b data-source="src/App.jsx:1" />'));
    });

    it('keeps an existing data-source attribute', () => {
        assert.equal(t(`const a = <div data-source="x" />;`), `const a = <div data-source="x" />;`);
    });

    it('does not treat a spread as data-source', () => {
        assert.equal(t(`const a = <div {...p} />;`), `const a = <div {...p} data-source="src/App.jsx:1" />;`);
    });

    it('uses the line of the opening `<` for multi-line elements', () => {
        assert.ok(t(`const a = (\n  <div\n    id="x"\n  />\n);`).includes('id="x" data-source="src/App.jsx:2"'));
    });

    it('resolves paths against root, then cwd; an empty root keeps them absolute', () => {
        assert.equal(t(`<i />;`, { root: '/proj/src' }), `<i data-source="App.jsx:1" />;`);
        assert.equal(t(`<i />;`, { root: '' }), `<i data-source="/proj/src/App.jsx:1" />;`);
        assert.equal(t(`<i />;`, { cwd: '/other' }), `<i data-source="/proj/src/App.jsx:1" />;`);
    });

    it('works together with @babel/preset-react', () => {
        const out = transformSync(`<div />;`, {
            filename: '/proj/a.jsx',
            cwd: '/proj',
            babelrc: false,
            configFile: false,
            presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
            plugins: [reactSourceString],
        })?.code;
        assert.match(out, /"data-source": "a.jsx:1"/);
    });
});

describe('path helpers (parity with the SWC and Vite plugins)', () => {
    it('stripVirtualPrefix', () => {
        assert.equal(stripVirtualPrefix('[project]/src/a.tsx'), 'src/a.tsx');
        assert.equal(stripVirtualPrefix('/src/a.tsx'), '/src/a.tsx');
    });
    it('relativePath', () => {
        assert.equal(relativePath('/proj/', '/proj/src/a.tsx'), 'src/a.tsx');
        assert.equal(relativePath('C:/proj', 'C:\\proj\\a.tsx'), 'a.tsx');
        assert.equal(relativePath('/other', '/proj/a.tsx'), '/proj/a.tsx');
    });
});
