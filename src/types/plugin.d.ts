
/**
 * @file types/plugin.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES: file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\types.d.ts
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 *
 * @description
 *
 * @description
 *
 * Provides types to interface the plugin sysem in this project.
 *
 * All types exported from this definition file are prepended with `WpBuildPlugin`.
 */

import { IWpBuildApp } from "./app";
import { WpBuildLogTrueColor } from "./logger";
import { Options as DtsBundleOptions } from "dts-bundle/lib";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackCompilationAssets,
    WebpackCompilationParams, WebpackPluginInstance, WebpackCompilationHookStage, WebpackCompilation, WebpackStats
} from "./webpack";

declare type WpBuildPluginOptions =
{
    app: WpBuildApp;
    build?: string;
    globalCacheProps?: string[];
    registerVendorPluginsFirst?: boolean;
    registerVendorPluginsOnly?: boolean;
    wrapPlugin?: boolean;
    plugins?: WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[];
    [ key: string ]: any;
};

declare type WpBuildPluginVendorOptions =
{
    ctor: new(...args: any[]) => WebpackPluginInstance;
    options: Readonly<Record<string, any>>;
    [ key: string ]: any;
}

declare type WpBuildPluginCacheOptions = { file: string; }

declare type WpwApplyCallbackCompilationParam = (arg: WebpackCompilation) => void | Promise<void>;
declare type WpwApplyCallbackCompilerParam = (arg: WebpackCompiler) => void | Promise<void>;
declare type WpwApplyCallbackAssetsParam = (arg: WebpackCompilationAssets) => void | Promise<void>;
declare type WpwApplyCallbackCompilationParamsParam = (arg: WebpackCompilationParams) => void | Promise<void>;
declare type WpwApplyCallbackStatsParam = (arg: WebpackStats) => void | Promise<void>;
declare type WpwOnApplyCallback = WpwApplyCallbackStatsParam | WpwApplyCallbackCompilationParam | WpwApplyCallbackCompilerParam | WpwApplyCallbackAssetsParam | WpwApplyCallbackCompilationParamsParam;

declare type WpBuildPluginTapOptions =
{
    async?: boolean;
    hook: WebpackCompilerHookName;
    hookCompilation?: WebpackCompilationHookName;
    callback: WpwOnApplyCallback;
    stage?: WebpackCompilationHookStage;
    statsProperty?: string;
    statsPropertyColor?: WpBuildLogTrueColor;
};
declare type WpBuildPluginTapOptionsHash  = Record<string, WpBuildPluginTapOptions>

declare interface IWpBuildPlugin
{
}

declare type WpBuildDtsBundleOptions = DtsBundleOptions & { baseDir: string; name: string; out: string; };


export {
    IWpBuildPlugin,
    WpBuildDtsBundleOptions,
    WpBuildPluginCacheOptions,
    WpBuildPluginOptions,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsHash,
    WpBuildPluginVendorOptions
};
