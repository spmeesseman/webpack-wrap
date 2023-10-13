
/**
 * @file src/types/plugin.ts
 * @version 0.0.1
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
 * Provides types to interface the project's plugin system
 *
 *//** */

import { RequireKeys } from "./generic";
import { WpwPluginConfigWaitItem } from "./rc";
import { IWpwBaseModule, WpwBaseModuleOptions } from "./base";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackPluginInstance,
    WebpackCompilationHookStage, WebpackCompilation, WebpackAsyncHook
} from "./webpack";

// declare function isAsyncHook<T>(v: any): v is WebpackAsyncHook<T>;
// declare function isTapable<T>(v: any):v is WebpackHook<T>

type WpwPluginOptions = WpwBaseModuleOptions;

type WpwPluginBaseTaskOptions = { taskHandler: string; hooks?: WpwPluginTapOptions } & WpwPluginOptions;

type WpwPluginWaitOptions = WpwPluginConfigWaitItem & { callback: WpwPluginWrappedHookHandler };

type WpwPluginMultiWaitOptions = WpwPluginWaitOptions[];

type WpwPluginHookHandler = string | ((...args: any[]) => WpwPluginHookHandlerResult);

type WpwPluginHookWaitStage = "done" | "inprocess" | "start" | undefined;

type WpwPluginHookHandlerResult = void | Promise<void> | WpwPluginHookWaitStage | Promise<WpwPluginHookWaitStage>;

type WpwPluginWrappedHookHandlerSync = (...args: any[]) => any;

type WpwPluginWrappedHookHandlerAsync = (...args: any[]) => Promise<any>;

type WpwPluginWrappedHookHandler = WpwPluginWrappedHookHandlerAsync | WpwPluginWrappedHookHandlerSync;

type WpwPluginWrappedHookHandlerResult<T> = T extends true ? WpwPluginWrappedHookHandlerAsync : WpwPluginWrappedHookHandlerSync;

type WpwPluginTapOptions  = Record<string, WpwPluginBaseTapOptions | WpwPluginCompilationTapOptions>;

interface WpwPluginBaseTapOptions
{
    async?: boolean;
    hook: WebpackCompilerHookName;
    hookCompilation?: WebpackCompilationHookName;
    callback: WpwPluginHookHandler;
    forceRun?: boolean;
    stage?: WebpackCompilationHookStage;
    statsProperty?: string;
    waitStage?: WpwPluginHookWaitStage;
};
type WpwPluginCompilationTapOptions = RequireKeys<WpwPluginBaseTapOptions, "stage" | "hookCompilation">;
type WpwPluginCompilationTapOptionsPair = [string, WpwPluginCompilationTapOptions];

interface IWpwPlugin extends IWpwBaseModule, WebpackPluginInstance
{
    compilation?: WebpackCompilation;
    compiler?: WebpackCompiler;
}

type WpwPluginConstructor<T> = new(arg1: WpwPluginOptions) => T;


export {
    IWpwPlugin,
    WpwPluginBaseTapOptions,
    WpwPluginBaseTaskOptions,
    WpwPluginCompilationTapOptions,
    WpwPluginCompilationTapOptionsPair,
    WpwPluginConstructor,
    WpwPluginHookHandler,
    WpwPluginHookHandlerResult,
    WpwPluginHookWaitStage,
    WpwPluginMultiWaitOptions,
    WpwPluginOptions,
    WpwPluginTapOptions,
    WpwPluginWaitOptions,
    WpwPluginWrappedHookHandler,
    WpwPluginWrappedHookHandlerResult,
    WpwPluginWrappedHookHandlerAsync,
    WpwPluginWrappedHookHandlerSync
};
