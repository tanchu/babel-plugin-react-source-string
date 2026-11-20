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
    /**
     * Packages whose components get tagged (a subpath like `@mui/material/Button` matches `@mui/material`).
     * HTML elements are always tagged. Not set or empty: every component is tagged.
     */
    libraries?: string[];
    /**
     * Put the attribute before spread props, so a `data-source` passed in from the parent wins:
     * a wrapper like `<Button {...props} />` then points to where the wrapper is used, not to the wrapper file.
     */
    preferCallSite?: boolean;
}

interface PluginOptions extends BabelCoreNamespace.PluginPass {
    opts: ReactSourceStringOptions;
    libraryImports?: Set<string>;
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

/** Same rule as the SWC and Vite plugins: the package itself or any of its subpaths. */
export function fromLibrary(source: string, libraries: string[]): boolean {
    return libraries.some((lib) => source === lib || source.startsWith(`${lib}/`));
}

/** The identifier that decides whether the element is a component: `UI` for `<UI.Button>`. */
function rootName(name: JSXOpeningElement['name']): string {
    let node = name;
    while (node.type === 'JSXMemberExpression') node = node.object as JSXOpeningElement['name'];
    if (node.type === 'JSXNamespacedName') return node.namespace.name;
    return node.type === 'JSXIdentifier' ? node.name : 'this';
}

function isHtmlElement(name: JSXOpeningElement['name']): boolean {
    if (name.type === 'JSXNamespacedName') return true;
    if (name.type !== 'JSXIdentifier') return false;
    const first = name.name[0];
    return first === first.toLowerCase() && first !== first.toUpperCase();
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

const plugin = (api: BabelAPI): PluginObj<PluginOptions> => {
    api.assertVersion(SUPPORTED_BABEL);
    const { types } = api;

    return {
        name: 'babel-plugin-react-source-string',
        visitor: {
            Program(path, state) {
                const libraries = Array.isArray(state.opts?.libraries) ? state.opts.libraries : [];
                if (libraries.length === 0) return;

                const imports = new Set<string>();
                for (const statement of path.node.body) {
                    if (statement.type !== 'ImportDeclaration' || !fromLibrary(statement.source.value, libraries)) continue;
                    for (const specifier of statement.specifiers) imports.add(specifier.local.name);
                }
                state.libraryImports = imports;
            },
            JSXOpeningElement(path, state) {
                if (!state.filename) return;

                const imports = state.libraryImports;
                if (imports && !isHtmlElement(path.node.name) && !imports.has(rootName(path.node.name))) return;

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

                const attribute = types.jsxAttribute(types.jsxIdentifier(ATTR), types.stringLiteral(`${file}:${line}`));
                if (state.opts?.preferCallSite) path.node.attributes.unshift(attribute);
                else path.node.attributes.push(attribute);
            },
        },
    };
};

/** Public signature without Babel's own types: they differ between Babel 7 and 8. */
const reactSourceString = plugin as unknown as (
    api: object,
    options?: ReactSourceStringOptions
) => { name: string; visitor: object };

export default reactSourceString;
