
/**
 * @file src/types/base.ts
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
 * @description
 *
 * Definitions to interface the base wpw abstract classes
 *
 *//** */

import { IDisposable } from "./generic";
import { WpwBuildOptionsKey } from "./rc";


type WpwBuildInstance = InstanceType<typeof import("../core/build")>;

type WpwLoggerInstance = InstanceType<typeof import("../utils/console")>;

interface IWpwBaseModuleOptions extends IWpwBaseOptions
{
    build: WpwBuildInstance;
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
    build: WpwBuildInstance;
}

interface IWpwBase extends IDisposable
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
