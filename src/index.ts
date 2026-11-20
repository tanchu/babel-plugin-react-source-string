import type * as BabelCoreNamespace from '@babel/core';
import type { ConfigAPI, PluginObj } from '@babel/core';
import type { JSXOpeningElement } from '@babel/types';

type BabelAPI = typeof BabelCoreNamespace & ConfigAPI;

/** Babel versions this release supports; keep in sync with `peerDependencies` in package.json. */
export const SUPPORTED_BABEL = '^7.0.0 || ^8.0.0';

export interface ReactSourceStringOptions {
    /** Component/element names to skip (case-insensitive). For `<Foo.Bar>` the name is `Bar`. */
    excluded?: string[];
    /** Project root for relative paths. Defaults to Babel's `cwd`; an empty string keeps paths absolute. */
    root?: string;
}

export interface PluginOptions extends BabelCoreNamespace.PluginPass {
    opts: ReactSourceStringOptions;
}

const ATTR = 'data-source';

/** Turbopack-style ids look like `[project]/src/a.tsx`. Same as the SWC and Vite plugins. */
export function stripVirtualPrefix(filename: string): string {
    if (filename.startsWith('[')) {
        const pos = filename.indexOf(']/');
        if (pos !== -1) return filename.slice(pos + 2);
    }
    return filename;
}

/** Same semantics as the SWC and Vite plugins: a file outside `cwd` keeps its absolute path. */
export function relativePath(cwd: string, filename: string): string {
    const base = cwd.replace(/\\/g, '/').replace(/\/+$/, '');
    const file = filename.replace(/\\/g, '/');
    return file.startsWith(base) ? file.slice(base.length).replace(/^\/+/, '') : file;
}

function elementName(name: JSXOpeningElement['name']): string {
    switch (name.type) {
        case 'JSXIdentifier':
            return name.name;
        case 'JSXMemberExpression':
            return name.property.name;
        case 'JSXNamespacedName':
        default:
            return name.name.name;
    }
}

const reactSourceString = (api: BabelAPI): PluginObj<PluginOptions> => {
    api.assertVersion(SUPPORTED_BABEL);
    const { types } = api;

    return {
        name: 'babel-plugin-react-source-string',
        visitor: {
            JSXOpeningElement(path, state) {
                if (!state.filename) return;

                const excluded = Array.isArray(state.opts?.excluded) ? state.opts.excluded : [];
                const name = elementName(path.node.name);
                if (excluded.some((item) => item.toLowerCase() === name.toLowerCase())) return;

                const hasDataSource = path.node.attributes.some(
                    (attr) => attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === ATTR
                );
                if (hasDataSource) return;

                const root = state.opts?.root ?? state.cwd;
                const display = stripVirtualPrefix(state.filename.replace(/\\/g, '/'));
                const file = root ? relativePath(root, display) : display;
                const line = path.node.loc?.start.line;
                if (line === undefined) return;

                path.node.attributes.push(
                    types.jsxAttribute(types.jsxIdentifier(ATTR), types.stringLiteral(`${file}:${line}`))
                );
            },
        },
    };
};

export default reactSourceString;
