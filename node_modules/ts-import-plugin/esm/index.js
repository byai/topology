import { __assign, __spreadArrays } from "tslib";
import * as ts from 'typescript';
import { join as pathJoin, sep } from 'path';
function join() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    /* istanbul ignore if  */
    if (sep === '\\') {
        var ret = pathJoin.apply(void 0, params);
        return ret.replace(/\\/g, '/');
    }
    /* istanbul ignore next  */
    return pathJoin.apply(void 0, params);
}
// camel2Dash camel2Underline
// borrow from https://github.com/ant-design/babel-plugin-import
function camel2Dash(_str) {
    var str = _str[0].toLowerCase() + _str.substr(1);
    return str.replace(/([A-Z])/g, function ($1) { return "-" + $1.toLowerCase(); });
}
function camel2Underline(_str) {
    var str = _str[0].toLowerCase() + _str.substr(1);
    return str.replace(/([A-Z])/g, function ($1) { return "_" + $1.toLowerCase(); });
}
function getImportedStructs(node) {
    var structs = new Set();
    node.forEachChild(function (importChild) {
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
        importChild.namedBindings.forEachChild(function (namedBinding) {
            // ts.NamedImports.elements will always be ts.ImportSpecifier
            var importSpecifier = namedBinding;
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
    var astNodes = [];
    var libraryName = options.libraryName, libraryOverride = options.libraryOverride;
    var _importName = struct.importName;
    var importName = options.camel2UnderlineComponentName
        ? camel2Underline(_importName)
        : options.camel2DashComponentName
            ? camel2Dash(_importName)
            : _importName;
    var libraryDirectory = typeof options.libraryDirectory === 'function'
        ? options.libraryDirectory(_importName)
        : join(options.libraryDirectory || '', importName);
    /* istanbul ignore next  */
    if (process.env.NODE_ENV !== 'production' && libraryDirectory == null) {
        console.warn("custom libraryDirectory resolve a " + libraryDirectory + " path");
    }
    var importPath = !libraryOverride ? join(libraryName, libraryDirectory) : libraryDirectory;
    var canResolveImportPath = true;
    try {
        require.resolve(importPath, {
            paths: __spreadArrays([process.cwd()], options.resolveContext),
        });
    }
    catch (e) {
        canResolveImportPath = false;
        astNodes.push(ts.createImportDeclaration(undefined, undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier(_importName))])), ts.createLiteral(libraryName)));
    }
    if (canResolveImportPath) {
        var scriptNode = ts.createImportDeclaration(undefined, undefined, ts.createImportClause(struct.variableName || !options.transformToDefaultImport ? undefined : ts.createIdentifier(struct.importName), struct.variableName
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
            var style = options.style;
            var stylePath = void 0;
            if (typeof style === 'function') {
                stylePath = style(importPath);
            }
            else {
                // eslint-disable-next-line no-restricted-syntax
                stylePath = importPath + "/style/" + (style === true ? 'index' : style) + ".js";
            }
            if (stylePath) {
                var styleNode = ts.createImportDeclaration(undefined, undefined, undefined, ts.createLiteral(stylePath));
                astNodes.push(styleNode);
            }
        }
    }
    return astNodes;
}
var defaultOptions = {
    libraryName: 'antd',
    libraryDirectory: 'lib',
    style: false,
    camel2DashComponentName: true,
    transformToDefaultImport: true,
    resolveContext: [],
    libraryOverride: false,
};
export function createTransformer(_options) {
    if (_options === void 0) { _options = {}; }
    var mergeDefault = function (options) { return (__assign(__assign({}, defaultOptions), options)); };
    var optionsArray = Array.isArray(_options)
        ? _options.map(function (options) { return mergeDefault(options); })
        : [mergeDefault(_options)];
    return function (context) {
        var visitor = function (node) {
            if (ts.isSourceFile(node)) {
                return ts.visitEachChild(node, visitor, context);
            }
            if (!ts.isImportDeclaration(node)) {
                return node;
            }
            var importedLibName = node.moduleSpecifier.text;
            var options = optionsArray.find(function (_) { return _.libraryName === importedLibName; });
            if (!options) {
                return node;
            }
            var structs = getImportedStructs(node);
            if (structs.size === 0) {
                return node;
            }
            return Array.from(structs).reduce(function (acc, struct) {
                var nodes = createDistAst(struct, options);
                return acc.concat(nodes);
            }, []);
        };
        return function (node) { return ts.visitNode(node, visitor); };
    };
}
export default createTransformer;
//# sourceMappingURL=index.js.map