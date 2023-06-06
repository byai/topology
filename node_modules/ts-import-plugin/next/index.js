import * as ts from 'typescript';
import { join as pathJoin, sep } from 'path';
function join(...params) {
    /* istanbul ignore if  */
    if (sep === '\\') {
        const ret = pathJoin(...params);
        return ret.replace(/\\/g, '/');
    }
    /* istanbul ignore next  */
    return pathJoin(...params);
}
// camel2Dash camel2Underline
// borrow from https://github.com/ant-design/babel-plugin-import
function camel2Dash(_str) {
    const str = _str[0].toLowerCase() + _str.substr(1);
    return str.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`);
}
function camel2Underline(_str) {
    const str = _str[0].toLowerCase() + _str.substr(1);
    return str.replace(/([A-Z])/g, ($1) => `_${$1.toLowerCase()}`);
}
function getImportedStructs(node) {
    const structs = new Set();
    node.forEachChild((importChild) => {
        if (!ts.isImportClause(importChild)) {
            return;
        }
        // not allow default import, or mixed default and named import
        // e.g. import foo from 'bar'
        // e.g. import foo, { bar as baz } from 'x'
        // and must namedBindings exist
        if (importChild.name || !importChild.namedBindings) {
            return;
        }
        // not allow namespace import
        // e.g. import * as _ from 'lodash'
        if (!ts.isNamedImports(importChild.namedBindings)) {
            return;
        }
        importChild.namedBindings.forEachChild((namedBinding) => {
            // ts.NamedImports.elements will always be ts.ImportSpecifier
            const importSpecifier = namedBinding;
            // import { foo } from 'bar'
            if (!importSpecifier.propertyName) {
                structs.add({ importName: importSpecifier.name.text });
                return;
            }
            // import { foo as bar } from 'baz'
            structs.add({
                importName: importSpecifier.propertyName.text,
                variableName: importSpecifier.name.text,
            });
        });
    });
    return structs;
}
function createDistAst(struct, options) {
    const astNodes = [];
    const { libraryName, libraryOverride } = options;
    const _importName = struct.importName;
    const importName = options.camel2UnderlineComponentName
        ? camel2Underline(_importName)
        : options.camel2DashComponentName
            ? camel2Dash(_importName)
            : _importName;
    const libraryDirectory = typeof options.libraryDirectory === 'function'
        ? options.libraryDirectory(_importName)
        : join(options.libraryDirectory || '', importName);
    /* istanbul ignore next  */
    if (process.env.NODE_ENV !== 'production' && libraryDirectory == null) {
        console.warn(`custom libraryDirectory resolve a ${libraryDirectory} path`);
    }
    const importPath = !libraryOverride ? join(libraryName, libraryDirectory) : libraryDirectory;
    let canResolveImportPath = true;
    try {
        require.resolve(importPath, {
            paths: [process.cwd(), ...options.resolveContext],
        });
    }
    catch (e) {
        canResolveImportPath = false;
        astNodes.push(ts.createImportDeclaration(undefined, undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier(_importName))])), ts.createLiteral(libraryName)));
    }
    if (canResolveImportPath) {
        const scriptNode = ts.createImportDeclaration(undefined, undefined, ts.createImportClause(struct.variableName || !options.transformToDefaultImport ? undefined : ts.createIdentifier(struct.importName), struct.variableName
            ? ts.createNamedImports([
                ts.createImportSpecifier(options.transformToDefaultImport
                    ? ts.createIdentifier('default')
                    : ts.createIdentifier(struct.importName), ts.createIdentifier(struct.variableName)),
            ])
            : options.transformToDefaultImport
                ? undefined
                : ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier(struct.importName))])), ts.createLiteral(importPath));
        astNodes.push(scriptNode);
        if (options.style) {
            const { style } = options;
            let stylePath;
            if (typeof style === 'function') {
                stylePath = style(importPath);
            }
            else {
                // eslint-disable-next-line no-restricted-syntax
                stylePath = `${importPath}/style/${style === true ? 'index' : style}.js`;
            }
            if (stylePath) {
                const styleNode = ts.createImportDeclaration(undefined, undefined, undefined, ts.createLiteral(stylePath));
                astNodes.push(styleNode);
            }
        }
    }
    return astNodes;
}
const defaultOptions = {
    libraryName: 'antd',
    libraryDirectory: 'lib',
    style: false,
    camel2DashComponentName: true,
    transformToDefaultImport: true,
    resolveContext: [],
    libraryOverride: false,
};
export function createTransformer(_options = {}) {
    const mergeDefault = (options) => ({ ...defaultOptions, ...options });
    const optionsArray = Array.isArray(_options)
        ? _options.map((options) => mergeDefault(options))
        : [mergeDefault(_options)];
    return (context) => {
        const visitor = (node) => {
            if (ts.isSourceFile(node)) {
                return ts.visitEachChild(node, visitor, context);
            }
            if (!ts.isImportDeclaration(node)) {
                return node;
            }
            const importedLibName = node.moduleSpecifier.text;
            const options = optionsArray.find((_) => _.libraryName === importedLibName);
            if (!options) {
                return node;
            }
            const structs = getImportedStructs(node);
            if (structs.size === 0) {
                return node;
            }
            return Array.from(structs).reduce((acc, struct) => {
                const nodes = createDistAst(struct, options);
                return acc.concat(nodes);
            }, []);
        };
        return (node) => ts.visitNode(node, visitor);
    };
}
export default createTransformer;
//# sourceMappingURL=index.js.map