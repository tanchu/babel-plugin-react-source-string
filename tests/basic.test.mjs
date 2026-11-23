import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { transformSync, version } from '@babel/core';
import reactSourceString, { OVERLAY_MODULE, fromLibrary, relativePath, stripVirtualPrefix } from '../dist/index.mjs';

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

    it('never tags Fragment or React.Fragment, even without options', () => {
        assert.equal(
            t(`const a = <Fragment><React.Fragment key="k"><b /></React.Fragment></Fragment>;`),
            `const a = <Fragment><React.Fragment key="k"><b data-source="src/App.jsx:1" /></React.Fragment></Fragment>;`
        );
        assert.equal(t(`<Fragments />;`), `<Fragments data-source="src/App.jsx:1" />;`);
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

    it('with libraries, tags HTML elements and only components imported from those packages', () => {
        const out = t(
            [
                `import { Button } from '@mui/material';`,
                `import Card from '@mui/material/Card';`,
                `import * as UI from '@mui/material';`,
                `import { Pencil } from 'lucide-react';`,
                `const a = <div><Button /><Card /><UI.Chip /><Pencil /><Local /><svg:rect /></div>;`,
            ].join('\n'),
            { libraries: ['@mui/material'] }
        );
        assert.ok(out.includes('<div data-source="src/App.jsx:5">'));
        assert.ok(out.includes('<Button data-source="src/App.jsx:5" />'));
        assert.ok(out.includes('<Card data-source="src/App.jsx:5" />'));
        assert.ok(out.includes('<UI.Chip data-source="src/App.jsx:5" />'));
        assert.ok(out.includes('<Pencil />'));
        assert.ok(out.includes('<Local />'));
        assert.ok(out.includes('<svg:rect data-source="src/App.jsx:5" />'));
    });

    it('with libraries, excluded still wins', () => {
        const out = t(`import { Button } from '@mui/material';\nconst a = <p><Button /></p>;`, {
            libraries: ['@mui/material'],
            excluded: ['button', 'P'],
        });
        assert.ok(out.includes('<p><Button /></p>'));
    });

    it('an empty libraries list tags every component', () => {
        assert.equal(t(`<Local />;`, { libraries: [] }), `<Local data-source="src/App.jsx:1" />;`);
    });

    it('by default the attribute goes after spread props (the wrapper file wins)', () => {
        assert.equal(
            t(`const B = (props) => <Button variant="x" {...props} />;`),
            `const B = props => <Button variant="x" {...props} data-source="src/App.jsx:1" />;`
        );
    });

    it('preferCallSite puts the attribute first, so a data-source from the call site wins', () => {
        assert.equal(
            t(`const B = (props) => <Button variant="x" {...props} />;`, { preferCallSite: true }),
            `const B = props => <Button data-source="src/App.jsx:1" variant="x" {...props} />;`
        );
        assert.equal(t(`<i />;`, { preferCallSite: true }), `<i data-source="src/App.jsx:1" />;`);
    });

    it('overlay imports the dev overlay once, only into files with tagged elements', () => {
        const out = t(`'use client';\nexport const A = () => <div><b /></div>;`, { overlay: true });
        assert.equal(out.split(OVERLAY_MODULE).length - 1, 1);
        assert.ok(out.startsWith(`'use client';\n\nimport "${OVERLAY_MODULE}";`) || out.startsWith(`'use client';\n\nimport '${OVERLAY_MODULE}';`), out);
        assert.ok(!t(`export const a = 1;`, { overlay: true }).includes(OVERLAY_MODULE));
        assert.ok(!t(`const a = <Slot />;`, { overlay: true, excluded: ['Slot'] }).includes(OVERLAY_MODULE));
        assert.ok(!t(`const a = <div />;`).includes(OVERLAY_MODULE));
    });

    it('the overlay module is a plain script that resolves through the package exports', () => {
        const file = require.resolve(OVERLAY_MODULE);
        assert.match(file, /overlay\.js$/);
        const code = readFileSync(file, 'utf8');
        assert.ok(!/^\s*(import|export)\s/m.test(code));
        assert.doesNotThrow(() => new Function(code)()); // no window: does nothing
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
    it('fromLibrary', () => {
        assert.equal(fromLibrary('@mui/material', ['@mui/material']), true);
        assert.equal(fromLibrary('@mui/material/Button', ['@mui/material']), true);
        assert.equal(fromLibrary('@mui/material-next', ['@mui/material']), false);
        assert.equal(fromLibrary('@mui/icons-material', ['@mui']), true);
    });
    it('relativePath', () => {
        assert.equal(relativePath('/proj/', '/proj/src/a.tsx'), 'src/a.tsx');
        assert.equal(relativePath('C:/proj', 'C:\\proj\\a.tsx'), 'a.tsx');
        assert.equal(relativePath('/other', '/proj/a.tsx'), '/proj/a.tsx');
    });
});
