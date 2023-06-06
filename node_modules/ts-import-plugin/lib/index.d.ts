import * as ts from 'typescript';
export interface Options {
    libraryName?: string;
    style?: boolean | 'css' | 'css.web' | string | ((name: string) => string | false);
    libraryDirectory?: ((name: string) => string) | string;
    libraryOverride?: boolean;
    camel2DashComponentName?: boolean;
    camel2UnderlineComponentName?: boolean;
    transformToDefaultImport?: boolean;
    resolveContext?: string[];
}
export interface ImportedStruct {
    importName: string;
    variableName?: string;
}
export declare function createTransformer(_options?: Partial<Options> | Array<Partial<Options>>): (context: ts.TransformationContext) => (node: ts.Node) => ts.Node;
export default createTransformer;
