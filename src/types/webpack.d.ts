/* eslint-disable import/no-extraneous-dependencies */

/**
 * @file types/webpack.d.ts
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
 * This definition file provides some manipulated base webpack types specifically for this project.
 *
 * All types exported from this definition file are prepended with `Webpack`.
 *
 * Targets:
 *
 * async-node[[X].Y]	    Compile for usage in a Node.js-like environment (uses fs and vm to load chunks asynchronously)
 * electron[[X].Y]-main	    Compile for Electron for main process.
 * electron[[X].Y]-renderer	Compile for Electron for renderer process, providing a target using JsonpTemplatePlugin,
 *                          FunctionModulePlugin for browser environments and NodeTargetPlugin and ExternalsPlugin for
 *                          CommonJS and Electron built-in modules.
 * electron[[X].Y]-preload	Compile for Electron for renderer process, providing a target using NodeTemplatePlugin with
 *                          asyncChunkLoading set to true, FunctionModulePlugin for browser environments and NodeTargetPlugin
 *                          and ExternalsPlugin for CommonJS and Electron built-in modules.
 * node[[X].Y]	            Compile for usage in a Node.js-like environment (uses Node.js require to load chunks)
 * node-webkit[[X].Y]	    Compile for usage in WebKit and uses JSONP for chunk loading. Allows importing of built-i
 *                           Node.js modules and nw.gui (experimental)
 * nwjs[[X].Y]	            The same as node-webkit
 * web	Compile for usage in a browser-like environment (default)
 * webworker	            Compile as WebWorker
 * esX	                    Compile for specified ECMAScript version. Examples: es5, es2020.
 * browserslist             Infer a platform and the ES-features from a browserslist-config (default if browserslist config
 *                          is available)
 *//** */

import { ConvertType, PickByType, RequireKeys } from "./generic";
import { AsyncSeriesHook, HookMap, SyncHook, SyncBailHook } from "tapable";
import { Schema as WebpackSchema } from "schema-utils/declarations/validate";
import webpack, {
    Asset as WebpackAsset, AssetInfo as WebpackAssetInfo, AssetEmittedInfo as WebpackAssetEmittedInfo,
    Cache as WebpackCache, Chunk as WebpackChunk, Configuration as WebpackConfig, Compilation as WebpackCompilation,
    Compiler as WebpackCompiler, EntryObject, sources as WebpackSources, Stats as WebpackStats,
    StatsAsset as WebpackStatsAsset, WebpackPluginInstance, ModuleOptions, RuleSetRule, PathData as WebpackPathData,
    WebpackOptionsNormalized, RuleSetUse, ResolveOptions as WebpackResolveOptions, FileCacheOptions as WebpackFileCacheOptions,
    MemoryCacheOptions as WebpackMemoryCacheOptions
}from "webpack";

declare type WebpackAsyncHook<T> = AsyncSeriesHook<T>;

declare type WebpackCacheFacade = ReturnType<WebpackCompilation["getCache"]>;

declare type WebpackSource = WebpackSources.Source;

declare interface IWebpackCompilationAssets { [index: string]: WebpackSource }
declare type WebpackCompilationAssets = IWebpackCompilationAssets;

declare type WebpackCompilationHook = WebpackCompilation["hooks"];

declare type WebpackCompilationHookName = keyof WebpackCompilationHook;

declare interface IWebpackCompilationParams {
    normalModuleFactory: WebpackNormalModuleFactory;
    contextModuleFactory: WebpackContextModuleFactory;
}
declare type WebpackCompilationParams = IWebpackCompilationParams;

declare type WebpackCompilationHookStage = "ADDITIONAL" | "PRE_PROCESS" | "DERIVED" | "ADDITIONS" |  "OPTIMIZE" |
                                           "OPTIMIZE_COUNT" | "OPTIMIZE_COMPATIBILITY" | "OPTIMIZE_SIZE" |
                                           "DEV_TOOLING" | "OPTIMIZE_INLINE" | "SUMMARIZE" | "OPTIMIZE_HASH" |
                                           "OPTIMIZE_TRANSFER" | "ANALYSE" | "REPORT";

declare type WebpackCompilerHook = WebpackCompiler["hooks"];

declare type WebpackCompilerAsyncHook = PickByType<WebpackCompilerHook, AsyncSeriesHook<any>>;

declare type WebpackCompilerSyncHook = PickByType<WebpackCompilerHook, SyncHook<any>>;

declare type WebpackCompilerHookName = keyof WebpackCompilerHook;

declare type WebpackCompilerAsyncHookName = keyof WebpackCompilerAsyncHook;

declare type WebpackCompilerSyncHookName = keyof WebpackCompilerSyncHook;

declare type WebpackContextModuleFactory =  ReturnType<WebpackCompiler["createContextModuleFactory"]>;

declare type WebpackEtag = ReturnType<ReturnType<WebpackCompilation["getCache"]>["getLazyHashedEtag"]>;

declare type WebpackHookMap<H> = HookMap<H>;

declare type WebpackLogger = ReturnType<WebpackCompilation["getLogger"]>;

declare type WebpackLogLevel = Exclude<WebpackConfig["infrastructureLogging"], undefined>["level"];

declare type WebpackMode = WebpackConfig["mode"];

declare type WebpackModuleOptions = { rules: WebpackRuleSetRule[] } & ModuleOptions;

declare type WebpackNormalModuleFactory =  ReturnType<WebpackCompiler["createNormalModuleFactory"]>;

declare type WebpackOptimization = WebpackOptionsNormalized["optimization"];

declare type WebpackEntry = EntryObject;

declare type WebpackOutput = RequireKeys<Exclude<WebpackConfig["output"], undefined>, "path">;

declare type WebpackRawSource = WebpackSources.RawSource;

declare type WebpackRuleSetRule = Exclude<ConvertType<RuleSetRule, (false | "" | 0 | RuleSetRule | "..." | null | undefined)[] , RuleSetRule[]>, undefined>;

declare interface IWebpackRuntimeArgs extends Record<string, string[] | string | boolean | WebpackRuntimeEnvArgs | undefined>
{
    clean?: boolean;
    config: string[];
    env: WebpackRuntimeEnvArgs;
    mode?: WebpackMode;
    watch?: boolean;
}
declare type WebpackRuntimeArgs = IWebpackRuntimeArgs;

declare interface IWebpackRuntimeEnvArgs { WEBPACK_WATCH?: boolean; watch?: boolean }
declare type WebpackRuntimeEnvArgs = IWebpackRuntimeEnvArgs;

declare type WebpackSnapshot = ReturnType<WebpackCompilation["fileSystemInfo"]["mergeSnapshots"]>;

declare type WebpackStatsPrinterType<T> = T extends WebpackSyncHook<infer X> ? X : never;

declare type WebpackStatsPrinterPrint<T> =  T extends WebpackHookMap<infer X> ? X : never;

declare type WebpackStatsPrinterContextHook<T, Y> =  T extends WebpackSyncBailHook<infer X, Y> ? X : never;

declare type WebpackStatsPrinterContext = WebpackStatsPrinterContextHook<WebpackStatsPrinterPrint<WebpackStatsPrinterType<WebpackCompilationHook["statsPrinter"]>[0]["hooks"]["print"]>, string>[1];

declare type WebpackSyncBailHook<T, R> = SyncBailHook<T, R>;

declare type WebpackSyncHook<T> = SyncHook<T>;

declare type WebpackRuleSetUse = Exclude<RuleSetUse, string>;

// declare type WebpackRuleSetUseItem = Exclude<RuleSetUseItem, (string | undefined)>;
declare interface IWebpackRuleSetUseItem { ident?: string; loader?: string; options: Record<string, any> };
declare type WebpackRuleSetUseItem = WebpackRuleSetUseItem;

declare type WebpackType = typeof webpack;

export {
    IWebpackRuntimeEnvArgs,
    IWebpackCompilationAssets,
    IWebpackCompilationParams,
    IWebpackRuntimeArgs,
    IWebpackRuleSetUseItem,
    WebpackType,
    WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs,
    WebpackAsset,
    WebpackAssetInfo,
    WebpackAssetEmittedInfo,
    WebpackAsyncHook,
    WebpackSyncHook,
    WebpackCache,
    WebpackCacheFacade,
    WebpackChunk,
    WebpackCompilation,
    WebpackCompilationAssets,
    WebpackCompilationHook,
    WebpackCompilationHookName,
    WebpackCompilationHookStage,
    WebpackCompilationParams,
    WebpackCompiler,
    WebpackCompilerHook,
    WebpackCompilerHookName,
    WebpackCompilerAsyncHook,
    WebpackCompilerAsyncHookName,
    WebpackCompilerSyncHook,
    WebpackCompilerSyncHookName,
    WebpackConfig,
    WebpackContextModuleFactory,
    WebpackEntry,
    WebpackEtag,
    WebpackFileCacheOptions,
    WebpackLogger,
    WebpackMemoryCacheOptions,
    WebpackMode,
    WebpackModuleOptions,
    WebpackNormalModuleFactory,
    WebpackOptimization,
    WebpackPathData,
    WebpackPluginInstance,
    WebpackLogLevel,
    WebpackOutput,
    WebpackRawSource,
    WebpackResolveOptions,
    WebpackRuleSetRule,
    WebpackRuleSetUse,
    WebpackRuleSetUseItem,
    WebpackSchema,
    WebpackSnapshot,
    WebpackSource,
    WebpackStats,
    WebpackStatsAsset,
    WebpackStatsPrinterContext
};
