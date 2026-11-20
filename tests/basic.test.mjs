import { transformSync } from '@babel/core';
import reactSourceString, { relativePath, stripVirtualPrefix } from '../dist/index.mjs';

const t = (code, { filename = '/proj/src/App.jsx', cwd = '/proj', ...opts } = {}) =>
    transformSync(code, {
        filename,
        cwd,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['jsx'] },
        plugins: [[reactSourceString, opts]],
    })?.code;

describe('babel-plugin-react-source-string', () => {
    it('tags HTML elements and components with path:line', () => {
        const out = t(`export const A = () => (\n  <div className="w">\n    <Pencil size={16} />\n  </div>\n);`);
        expect(out).toContain('<div className="w" data-source="src/App.jsx:2">');
        expect(out).toContain('<Pencil size={16} data-source="src/App.jsx:3" />');
    });

    it('tags member and namespaced names', () => {
        const out = t(`const a = <main><UI.Button /><svg:rect /></main>;`);
        expect(out).toContain('<main data-source="src/App.jsx:1">');
        expect(out).toContain('<UI.Button data-source="src/App.jsx:1" />');
        expect(out).toContain('<svg:rect data-source="src/App.jsx:1" />');
    });

    it('skips excluded names case-insensitively (member expression uses the last part)', () => {
        const out = t(`const a = <><Fragment><React.fragment><slot /></React.fragment></Fragment><b /></>;`, {
            excluded: ['Fragment', 'Slot'],
        });
        expect(out).toContain('<Fragment><React.fragment><slot /></React.fragment></Fragment>');
        expect(out).toContain('<b data-source="src/App.jsx:1" />');
        expect(out).toContain('<>');
    });

    it('keeps an existing data-source attribute', () => {
        expect(t(`const a = <div data-source="x" />;`)).toBe(`const a = <div data-source="x" />;`);
    });

    it('does not treat a spread as data-source', () => {
        expect(t(`const a = <div {...p} />;`)).toBe(`const a = <div {...p} data-source="src/App.jsx:1" />;`);
    });

    it('uses the line of the opening `<` for multi-line elements', () => {
        expect(t(`const a = (\n  <div\n    id="x"\n  />\n);`)).toContain('id="x" data-source="src/App.jsx:2"');
    });

    it('resolves paths against root, then cwd; an empty root keeps them absolute', () => {
        expect(t(`<i />;`, { root: '/proj/src' })).toBe(`<i data-source="App.jsx:1" />;`);
        expect(t(`<i />;`, { root: '' })).toBe(`<i data-source="/proj/src/App.jsx:1" />;`);
        expect(t(`<i />;`, { cwd: '/other' })).toBe(`<i data-source="/proj/src/App.jsx:1" />;`);
    });

    it('works after @babel/preset-react', () => {
        const out = transformSync(`<div />;`, {
            filename: '/proj/a.jsx',
            cwd: '/proj',
            babelrc: false,
            configFile: false,
            presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
            plugins: [reactSourceString],
        })?.code;
        expect(out).toContain('"data-source": "a.jsx:1"');
    });
});

describe('path helpers (parity with the SWC and Vite plugins)', () => {
    it('stripVirtualPrefix', () => {
        expect(stripVirtualPrefix('[project]/src/a.tsx')).toBe('src/a.tsx');
        expect(stripVirtualPrefix('/src/a.tsx')).toBe('/src/a.tsx');
    });
    it('relativePath', () => {
        expect(relativePath('/proj/', '/proj/src/a.tsx')).toBe('src/a.tsx');
        expect(relativePath('C:/proj', 'C:\\proj\\a.tsx')).toBe('a.tsx');
        expect(relativePath('/other', '/proj/a.tsx')).toBe('/proj/a.tsx');
    });
});
