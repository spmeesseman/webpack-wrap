
/**
 * @file src/types/plugin.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
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
import { WpwPluginConfigWaitItem } from "./rc";
import { IWpwBaseModule, WpwBaseModuleOptions } from "./base";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackPluginInstance, WebpackCompilationHookStage, WebpackCompilation
} from "./webpack";


type WpwPluginOptions =
{
    apps?: string[];
    registerVendorPluginsFirst?: boolean;
    registerVendorPluginsOnly?: boolean;
    wrapPlugin?: boolean;
} & WpwBaseModuleOptions;

type WpwPluginWaitOptions = WpwPluginConfigWaitItem & { callback: WpwPluginWrappedHookHandler };

type WpwPluginMultiWaitOptions = WpwPluginWaitOptions[];

type WpwPluginHookWaitStage = "done" | "inprocess" | "start" | undefined;

type WpwPluginHookHandlerResult = WpwPluginHookWaitStage | void;

type WpwPluginWrappedHookHandlerAsync = (...args: any[]) => void;

type WpwPluginWrappedHookHandlerSync = (...args: any[]) => Promise<void>;

type WpwPluginWrappedHookHandler = WpwPluginWrappedHookHandlerAsync | WpwPluginWrappedHookHandlerSync;

type WpwPluginHookHandler = (...args: any[]) => WpwPluginHookHandlerResult | Promise<WpwPluginHookHandlerResult>;

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
    WpwPluginCompilationTapOptions,
    WpwPluginHookHandler,
    WpwPluginHookWaitStage,
    WpwPluginMultiWaitOptions,
    WpwPluginOptions,
    WpwPluginTapOptions,
    WpwPluginWaitOptions,
    WpwPluginWrappedHookHandler,
    WpwPluginWrappedHookHandlerAsync,
    WpwPluginWrappedHookHandlerSync
};
