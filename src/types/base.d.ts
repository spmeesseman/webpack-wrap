
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
 * Provides types to interface the base abstract class extended by plugins/exports classes
 *
 *//** */

import { WpwBuildOptionsKey } from "./rc";
import { IWpBuildLogger } from "./logger";


declare interface IWpwBaseOptions
{
    app: typeof import("../core/app").prototype;
    key?: WpwBuildOptionsKey;
    globalCacheProps?: string[];
};
declare type WpwBaseOptions = IWpwBaseOptions;

// declare type WpwBaseOptions<T extends WpwBuildOptionsKey | undefined = undefined> =
// {
//     app: typeof import("../core/app").prototype,
//     key?: WpwBuildOptionsKey;
//     globalCacheProps?: string[];
// } & (T extends WpwBuildOptionsKey ? WpwBuildOptions[T] : {});

declare interface IWpwBase
{
    app: typeof import("../core/app").prototype;
    // key: WpwBuildOptionsKey;
    logger: IWpBuildLogger;
}


export { IWpwBase, IWpwBaseOptions, WpwBaseOptions };
