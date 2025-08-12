import { relative } from 'path';
import { PluginObj } from '@babel/core';
import type * as BabelCoreNamespace from '@babel/core';

type Babel = typeof BabelCoreNamespace;

export interface PluginOptions extends BabelCoreNamespace.PluginPass {
    opts: {
        libraries?: string[];
        excluded?: string[];
    };
}

const reactSourceString = ({ types }: Babel): PluginObj<PluginOptions> => ({
    name: 'babel-plugin-react-source-string',
    visitor: {
        Program(path, state) {
            const validLibraries = Array.isArray(state.opts?.libraries) ? state.opts?.libraries : [];
            const validExcluded = Array.isArray(state.opts?.excluded) ? state.opts?.excluded : [];

            const excludeList = new Set(validExcluded.map((i: string) => i.toLowerCase()));
            const librarySet = new Set(validLibraries);
            const UIImports = new Set();
            path.traverse({
                ImportDeclaration(importPath) {
                    const sourceValue = importPath.node.source.value;
                    if (librarySet.has(sourceValue) || librarySet.has(sourceValue.split('/')[0])) {
                        importPath.node.specifiers.forEach((specifier) => {
                            if (!validExcluded.includes(specifier.local.name)) {
                                UIImports.add(specifier.local.name);
                            }
                        });
                    }
                },
            });

            path.traverse({
                JSXOpeningElement(jsxPath) {
                    const identifier = jsxPath.node.name;

                    if (!identifier || (identifier.type !== 'JSXIdentifier' && identifier.type !== 'JSXNamespacedName')) {
                        return;
                    }

                    const elementName = typeof identifier.name === 'string' ? identifier.name : identifier.name.name;

                    if (excludeList.has(elementName.toLowerCase())) {
                        return;
                    }

                    const isLowercase = elementName === elementName.toLowerCase();
                    const isUIImport = UIImports.has(elementName);

                    if (state.filename && (isLowercase || isUIImport)) {
                        const source = `${relative(state.cwd, state.filename)}:${jsxPath.node.loc?.start.line}`;
                        const name = types.jsxIdentifier('data-source');
                        const value = types.stringLiteral(source);
                        const attribute = types.jsxAttribute(name, value);

                        const hasDataSource = jsxPath.node.attributes.some(
                            (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'data-source'
                        );

                        if (!hasDataSource) {
                            jsxPath.node.attributes.push(attribute);
                        }
                    }
                },
            });
        },
    },
});

export default reactSourceString;
