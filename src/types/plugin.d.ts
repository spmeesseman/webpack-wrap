
/**
 * @file types/plugin.d.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
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
 * Provides types to interface the plugin sysem in this project.
 *
 * All types exported from this definition file are prepended with `WpBuildPlugin`.
 *
 * When adding a new plugin, perform the following tasks:
 *
 *     1. Add the plugin filename (w/o extnsion) to the `WpBuildPluginName` type near the
 *        top of the WpBuild types file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\types\wpbuild.d.ts
 *
 *     2. Adjust the default application object's plugins hash by adding the plugin filename
 *        (w/o/ extension) as a key of the `plugins()` return object
 *        file:///:\Projects\vscode-taskexplorer\webpack\utils\environment.js
 *
 *     3. Adjust the rc configuration files by adding the plugin filename (w/o/ extension)
 *        as a key of the `plugins` object in both the schema json file and the defaults file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.schema.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.defaults.json
 *
 *     4. Run the `generate-wpbuild-types` script / npm task to rebyuild rc.d.ts definition file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\.wpbuildrc.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.schema.json
 *
 *     5. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\vscode-taskexplorer\webpack\plugin\index.js
 *
 *     6.  Add the module into the modulke in the webpack exports byt importing and placing it
 *         in an appropriate position in the configuraation plugin array.
 *         file:///c:\Projects\vscode-taskexplorer\webpack\exports\plugins.js
 *//** */

import { RequireKeys } from "./generic";
import { IWpBuildLogger } from "./logger";
import { WpwPluginConfigWaitDef } from "./rc";
import { IWpwBase, WpwBaseOptions } from "./base";
import { Options as DtsBundleOptions } from "dts-bundle/lib";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackCompilationAssets,
    WebpackCompilationParams, WebpackPluginInstance, WebpackCompilationHookStage, WebpackCompilation, WebpackStats
} from "./webpack";


declare type WpwPluginOptions =
{
    apps?: string[];
    build?: string;
    plugins?: WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[];
    registerVendorPluginsFirst?: boolean;
    registerVendorPluginsOnly?: boolean;
    wrapPlugin?: boolean;
} & WpwBaseOptions;

// declare type WpwPluginOptions<T extends WpwBuildOptionsKey | undefined = undefined> =
// {
//     apps?: string[];
//     build?: string;
//     plugins?: WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[];
//     registerVendorPluginsFirst?: boolean;
//     registerVendorPluginsOnly?: boolean;
//     wrapPlugin?: boolean;
// } & WpwBaseOptions<T>;

declare interface IWpBuildPluginVendorOptions
{
    ctor: new(...args: any[]) => WebpackPluginInstance;
    options: Readonly<Record<string, any>>;
    [ key: string ]: any;
}
declare type WpBuildPluginVendorOptions = IWpBuildPluginVendorOptions;

declare type WpBuildPluginWaitOptions = WpwPluginConfigWaitDef & { callback: (...args: any[]) => any };

declare type WpBuildPluginMultiWaitOptions = WpBuildPluginWaitOptions[];

declare interface IWpBuildPluginCacheOptions { file: string }
declare type WpBuildPluginCacheOptions = IWpBuildPluginCacheOptions;

declare type WpwApplyCallbackCompilationParam = (arg: WebpackCompilation) => void | Promise<void>;

declare type WpwApplyCallbackCompilerParam = (arg: WebpackCompiler) => void | Promise<void>;

declare type WpwApplyCallbackAssetsParam = (arg: WebpackCompilationAssets) => void | Promise<void>;

declare type WpwApplyCallbackCompilationParamsParam = (arg: WebpackCompilationParams) => void | Promise<void>;

declare type WpwApplyCallbackStatsParam = (arg: WebpackStats) => void | Promise<void>;

declare type WpwOnApplyCallback = WpwApplyCallbackStatsParam | WpwApplyCallbackCompilationParam | WpwApplyCallbackCompilerParam | WpwApplyCallbackAssetsParam | WpwApplyCallbackCompilationParamsParam;

declare type WpBuildPluginTapOptions  = Record<string, WpBuildPluginTapOptionsEntry | WpBuildPluginCompilationOptionsEntry>;

declare interface WpBuildPluginTapOptionsEntry
{
    async?: boolean;
    hook: WebpackCompilerHookName;
    hookCompilation?: WebpackCompilationHookName;
    callback: WpwOnApplyCallback;
    stage?: WebpackCompilationHookStage;
    statsProperty?: string;
};
declare type WpBuildPluginCompilationOptionsEntry = RequireKeys<WpBuildPluginTapOptionsEntry, "stage" | "hookCompilation">;

declare interface IWpBuildPlugin extends IWpwBase, WebpackPluginInstance
{
    // app: ClsWpBuildApp;
    compilation?: WebpackCompilation;
    compiler?: WebpackCompiler;
    logger: IWpBuildLogger;
}

declare type WpBuildDtsBundleOptions = DtsBundleOptions & { baseDir: string; name: string; out: string };


export {
    IWpBuildPlugin,
    IWpBuildPluginCacheOptions,
    IWpBuildPluginVendorOptions,
    WpBuildDtsBundleOptions,
    WpBuildPluginCacheOptions,
    WpBuildPluginCompilationOptionsEntry,
    WpwPluginOptions,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsEntry,
    WpBuildPluginVendorOptions,
    WpBuildPluginWaitOptions,
    WpBuildPluginMultiWaitOptions
};
