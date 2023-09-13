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

import { AsyncSeriesHook, HookMap, SyncHook, SyncBailHook } from "tapable";
import { Schema as WebpackSchema } from "schema-utils/declarations/validate";
import { ConvertType, PickByType, RequireKeys, ArrayInnerType } from "./generic";
import webpack, {
    Asset as WebpackAsset, AssetInfo as WebpackAssetInfo, AssetEmittedInfo as WebpackAssetEmittedInfo,
    Cache as WebpackCache, Chunk as WebpackChunk, Configuration as WebpackConfig, Compilation as WebpackCompilation,
    Compiler as WebpackCompiler, EntryObject, sources as WebpackSources, Stats as WebpackStats,
    StatsAsset as WebpackStatsAsset, WebpackPluginInstance, ModuleOptions, RuleSetRule, PathData as WebpackPathData,
    WebpackOptionsNormalized, RuleSetUse, ResolveOptions as WebpackResolveOptions, FileCacheOptions as WebpackFileCacheOptions,
    MemoryCacheOptions as WebpackMemoryCacheOptions, ExternalsPlugin, EntryOptions as WebpackEntryOptions, WebpackError
}from "webpack";

type WebpackAsyncHook<T> = AsyncSeriesHook<T>;

type WebpackCacheFacade = ReturnType<WebpackCompilation["getCache"]>;

type WebpackSource = WebpackSources.Source;

interface IWebpackCompilationAssets { [index: string]: WebpackSource }
type WebpackCompilationAssets = IWebpackCompilationAssets;

type WebpackCompilationHook = WebpackCompilation["hooks"];

type WebpackCompilationHookName = keyof WebpackCompilationHook;

interface IWebpackCompilationParams {
    normalModuleFactory: WebpackNormalModuleFactory;
    contextModuleFactory: WebpackContextModuleFactory;
}
type WebpackCompilationParams = IWebpackCompilationParams;

type WebpackCompilationHookStage = "ADDITIONAL" | "PRE_PROCESS" | "DERIVED" | "ADDITIONS" |  "OPTIMIZE" |
                                           "OPTIMIZE_COUNT" | "OPTIMIZE_COMPATIBILITY" | "OPTIMIZE_SIZE" |
                                           "DEV_TOOLING" | "OPTIMIZE_INLINE" | "SUMMARIZE" | "OPTIMIZE_HASH" |
                                           "OPTIMIZE_TRANSFER" | "ANALYSE" | "REPORT";

type WebpackCompilerHook = WebpackCompiler["hooks"];

type WebpackCompilerAsyncHook = PickByType<WebpackCompilerHook, AsyncSeriesHook<any>>;

type WebpackCompilerSyncHook = PickByType<WebpackCompilerHook, SyncHook<any>>;

type WebpackCompilerHookName = keyof WebpackCompilerHook;

type WebpackCompilerAsyncHookName = keyof WebpackCompilerAsyncHook;

type WebpackCompilerSyncHookName = keyof WebpackCompilerSyncHook;

type WebpackContextModuleFactory =  ReturnType<WebpackCompiler["createContextModuleFactory"]>;

type WebpackEtag = ReturnType<ReturnType<WebpackCompilation["getCache"]>["getLazyHashedEtag"]>;

type WebpackExternalItem = ArrayInnerType<ExternalsPlugin["externals"]>;

type WebpackHookMap<H> = HookMap<H>;

type WebpackLogger = ReturnType<WebpackCompilation["getLogger"]>;

type WebpackLogLevel = Exclude<WebpackConfig["infrastructureLogging"], undefined>["level"];

type WebpackMode = WebpackConfig["mode"];

type WebpackModuleOptions = { rules: WebpackRuleSetRule[] } & ModuleOptions;

type WebpackNormalModuleFactory =  ReturnType<WebpackCompiler["createNormalModuleFactory"]>;

type WebpackOptimization = WebpackOptionsNormalized["optimization"];

type WebpackEntry = EntryObject;

type WebpackOutput = RequireKeys<Exclude<WebpackConfig["output"], undefined>, "path">;

type WebpackRawSource = WebpackSources.RawSource;

type WebpackRuleSetRule = Exclude<ConvertType<RuleSetRule, (false | "" | 0 | RuleSetRule | "..." | null | undefined)[] , RuleSetRule[]>, undefined>;

interface IWebpackRuntimeArgs extends Record<string, string[] | string | boolean | WebpackRuntimeEnvArgs | undefined>
{
    clean?: boolean;
    config: string[];
    env: WebpackRuntimeEnvArgs;
    mode?: WebpackMode;
    watch?: boolean;
}
type WebpackRuntimeArgs = IWebpackRuntimeArgs;

interface IWebpackRuntimeEnvArgs { WEBPACK_WATCH?: boolean; watch?: boolean }
type WebpackRuntimeEnvArgs = IWebpackRuntimeEnvArgs;

type WebpackSnapshot = ReturnType<WebpackCompilation["fileSystemInfo"]["mergeSnapshots"]>;

type WebpackStatsPrinterType<T> = T extends WebpackSyncHook<infer X> ? X : never;

type WebpackStatsPrinterPrint<T> =  T extends WebpackHookMap<infer X> ? X : never;

type WebpackStatsPrinterContextHook<T, Y> =  T extends WebpackSyncBailHook<infer X, Y> ? X : never;

type WebpackStatsPrinterContext = WebpackStatsPrinterContextHook<WebpackStatsPrinterPrint<WebpackStatsPrinterType<WebpackCompilationHook["statsPrinter"]>[0]["hooks"]["print"]>, string>[1];

type WebpackSyncBailHook<T, R> = SyncBailHook<T, R>;

type WebpackSyncHook<T> = SyncHook<T>;

type WebpackRuleSetUse = Exclude<RuleSetUse, string>;

// type WebpackRuleSetUseItem = Exclude<RuleSetUseItem, (string | undefined)>;
interface IWebpackRuleSetUseItem { ident?: string; loader?: string; options: Record<string, any> };
type WebpackRuleSetUseItem = IWebpackRuleSetUseItem;

type WebpackType = typeof webpack;


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
    WebpackEntryOptions,
    WebpackError,
    WebpackEtag,
    WebpackExternalItem,
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
