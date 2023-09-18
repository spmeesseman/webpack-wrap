
/**
 * @file src/types/plugin.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\tapable\tapable.d.ts
 *
 * @description
 *
 * Provides types to interface the plugin sysem in this project.
 *
 * When adding a new extending plugin, perform the following tasks:
 *
 *     1. Add the plugin filename (w/o extnsion) to the `WpwPluginName` type near the
 *        top of the types file
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\src\types\wpwbuild.ts
 *
 *     2. Adjust the schema file by adding the plugin name to relevant areas, and adding a
 *        new config definition object.
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\src\schema\spm.schema.wpw.json
 *
 *     3. Run the `generate-rc-types` script / npm task to rebuild rc.ts definition file
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\script\generate-rc-types.js
 *
 *     4. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\@spmeesseman\webpack-wrap\src\plugin\index.js
 *
 *     5.  Add the plugin into the webpack exports by importing and placing it in an appropriate
 *         position in the exports.plugins array.
 *         file:///c:\Projects\@spmeesseman\webpack-wrap\src\exports\plugins.js
 *//** */

import { RequireKeys } from "./generic";
import { WpwPluginConfigWaitItem } from "./rc";
import { IWpwBaseModule, WpwBaseModuleOptions } from "./base";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackPluginInstance,
    WebpackCompilationHookStage, WebpackCompilation
} from "./webpack";


type WpwPluginOptions = WpwBaseModuleOptions;

type WpwPluginBaseTaskOptions = { taskHandler: string; hooks?: WpwPluginTapOptions } & WpwPluginOptions;

type WpwPluginWaitOptions = WpwPluginConfigWaitItem & { callback: WpwPluginWrappedHookHandler };

type WpwPluginMultiWaitOptions = WpwPluginWaitOptions[];

type WpwPluginHookWaitStage = "done" | "inprocess" | "start" | undefined;

type WpwPluginHookHandlerResult = WpwPluginHookWaitStage | void | Promise<void>;

type WpwPluginWrappedHookHandlerSync = (...args: any[]) => void;

type WpwPluginWrappedHookHandlerAsync = (...args: any[]) => Promise<void>;

type WpwPluginWrappedHookHandler = WpwPluginWrappedHookHandlerAsync | WpwPluginWrappedHookHandlerSync;

type WpwPluginHookHandler = string | ((...args: any[]) => WpwPluginHookHandlerResult) | Promise<WpwPluginHookHandlerResult>;

type WpwPluginTapOptions  = Record<string, WpwPluginBaseTapOptions | WpwPluginCompilationTapOptions>;

interface WpwPluginBaseTapOptions
{
    async?: boolean;
    hook: WebpackCompilerHookName;
    hookCompilation?: WebpackCompilationHookName;
    callback: WpwPluginHookHandler;
    stage?: WebpackCompilationHookStage;
    statsProperty?: string;
    waitStage?: WpwPluginHookWaitStage;
};
type WpwPluginCompilationTapOptions = RequireKeys<WpwPluginBaseTapOptions, "stage" | "hookCompilation">;

interface IWpwPlugin extends IWpwBaseModule, WebpackPluginInstance
{
    compilation?: WebpackCompilation;
    compiler?: WebpackCompiler;
}


export {
    IWpwPlugin,
    WpwPluginBaseTapOptions,
    WpwPluginBaseTaskOptions,
    WpwPluginCompilationTapOptions,
    WpwPluginHookHandler,
    WpwPluginHookHandlerResult,
    WpwPluginHookWaitStage,
    WpwPluginMultiWaitOptions,
    WpwPluginOptions,
    WpwPluginTapOptions,
    WpwPluginWaitOptions,
    WpwPluginWrappedHookHandler,
    WpwPluginWrappedHookHandlerAsync,
    WpwPluginWrappedHookHandlerSync
};
