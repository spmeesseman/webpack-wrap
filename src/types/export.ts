
/**
 * @file src/types/export.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\tapable\tapable.d.ts
 *
 *//** */


import { IWpwBaseModule, WpwBaseModuleOptions } from "./base";


type WpwExportOptions = WpwBaseModuleOptions;


interface IWpwExport extends IWpwBaseModule
{
    // app: ClsWpBuildApp;
    // compilation?: WebpackCompilation;
    // compiler?: WebpackCompiler;
}


export {
    IWpwExport,
    WpwExportOptions
};
