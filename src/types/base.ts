
/**
 * @file types/base.ts
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


type WpwAppInstance = InstanceType<typeof import("../core/app")>;

type WpwLoggerInstance = InstanceType<typeof import("../utils/console")>;

interface IWpwBaseModuleOptions extends IWpwBaseOptions
{
    app: WpwAppInstance;
    key?: WpwBuildOptionsKey;
    globalCacheProps?: string[];
};
type WpwBaseModuleOptions = IWpwBaseModuleOptions;

// type WpwBaseOptions<T extends WpwBuildOptionsKey | undefined = undefined> =
// {
//     app: typeof import("../core/app").prototype,
//     key?: WpwBuildOptionsKey;
//     globalCacheProps?: string[];
// } & (T extends WpwBuildOptionsKey ? WpwBuildOptions[T] : {});

interface IWpwBaseModule extends IWpwBase
{
    app: WpwAppInstance;
}

interface IWpwBase
{
    readonly name: string;
    readonly initialConfig: any;
    logger: WpwLoggerInstance;
}

interface IWpwBaseOptions
{
    logger?: WpwLoggerInstance;
    [key: string]: any;
};
type WpwBaseOptions = IWpwBaseOptions;


export { IWpwBase, IWpwBaseModule, IWpwBaseOptions, IWpwBaseModuleOptions, WpwBaseOptions, WpwBaseModuleOptions };
