
/**
 * @file types/base.d.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS    : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 *
 * @description
 *
 * Definitions to interface the base wpw abstract classes
 *
 *//** */

import { WpwBuildOptionsKey } from "./rc";
import { WpwLoggerOptions } from "./logger";


declare type WpwAppInstance = InstanceType<typeof import("../core/app")>;

declare type WpwLoggerInstance = InstanceType<typeof import("../utils/console")>;

declare interface IWpwBaseModuleOptions extends IWpwBaseOptions
{
    app: WpwAppInstance;
    key?: WpwBuildOptionsKey;
    globalCacheProps?: string[];
};
declare type WpwBaseModuleOptions = IWpwBaseModuleOptions;

// declare type WpwBaseOptions<T extends WpwBuildOptionsKey | undefined = undefined> =
// {
//     app: typeof import("../core/app").prototype,
//     key?: WpwBuildOptionsKey;
//     globalCacheProps?: string[];
// } & (T extends WpwBuildOptionsKey ? WpwBuildOptions[T] : {});

declare interface IWpwBaseModule extends IWpwBase
{
    app: WpwAppInstance;
}

declare interface IWpwBase
{
    readonly name: string;
    readonly initialConfig: any;
    logger: WpwLoggerInstance;
}

declare interface IWpwBaseOptions
{
    logger?: WpwLoggerOptions | WpwLoggerInstance;
    [key: string]: any;
};
declare type WpwBaseOptions = IWpwBaseOptions;


export { IWpwBase, IWpwBaseModule, IWpwBaseOptions, IWpwBaseModuleOptions, WpwBaseOptions, WpwBaseModuleOptions };
