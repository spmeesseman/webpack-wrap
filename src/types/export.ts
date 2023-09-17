
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
import { WebpackPluginInstance, WebpackCompiler } from "./webpack";

type WpwExportOptions = WpwBaseModuleOptions;

type WpwExportPlugin = WebpackPluginInstance | ((this: WebpackCompiler, compiler: WebpackCompiler) => void) | undefined;

interface IWpwExport extends IWpwBaseModule
{
}


export {
    IWpwExport,
    WpwExportOptions,
    WpwExportPlugin
};
