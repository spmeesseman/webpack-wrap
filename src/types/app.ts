// @ts-check

/**
 * @file src/types/app.ts
 * @version 0.0.1
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
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpwPlugin`.
 *//** */

 import {WpwExportPlugin } from "./export";
import {
    WpwWebpackEntryImport, WpwWebpackMode, WpwLoggerLevel, WebpackTarget, WpwSourceExtension,
    WebpackLibraryType, WpwSourceTsConfig, WpwSourceTsConfigFile
} from "./rc";
import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel, WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs, WebpackResolveOptions, WebpackInfrastructureLogging, WebpackMode,
    WebpackOutput, WebpackFileCacheOptions, WebpackMemoryCacheOptions, WebpackStatsOptions
} from "./webpack";


declare const __WPWRAP__: any;

interface IWpwGetRcPathOptions {
    build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string; fallback?: boolean;
};
type WpwGetRcPathOptions = IWpwGetRcPathOptions;

type WpwGetRelPathOptions = Exclude<WpwGetRcPathOptions, "build" | "fallback" | "rel" | "ctx"> & { case?: boolean };

type WpwGetAbsPathOptions = Exclude<WpwGetRcPathOptions, "build" | "dot" | "fallback" | "rel" | "ctx"> & { case?: boolean };

interface IWpwGlobalEnvironment {
    buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any;
};

interface IWpwRuntimeEnvArgs
{
    analyze?: boolean;
    build?: string;
    cleanCache?: boolean;
    mode?: WpwWebpackMode;
    loglevel?: WpwLoggerLevel | WebpackLogLevel;
    release?: boolean;
};
type WpwRuntimeEnvArgs = IWpwRuntimeEnvArgs;

type WpwCombinedRuntimeArgs =
    WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpwRuntimeEnvArgs & { mode: WpwWebpackMode | Exclude<WebpackMode, undefined> };

type WpwSourceDotExtensionApp = `.${WpwSourceExtension}`;

interface IWpwWebpackConfig extends WebpackConfig
{
    cache: WebpackFileCacheOptions | WebpackMemoryCacheOptions;
    context: string;
    mode: Exclude<WebpackConfig["mode"], undefined>;
    entry: WpwWebpackEntryImport & WebpackEntry;
    externalsType?: WebpackLibraryType;
    infrastructureLogging: WebpackInfrastructureLogging;
    output: WebpackOutput;
    plugins: WpwExportPlugin[];
    resolve: WebpackResolveOptions;
    stats: WebpackStatsOptions;
    target: WebpackTarget;
    module: WebpackModuleOptions;
}
type WpwWebpackConfig = IWpwWebpackConfig;

type WpwWebpackAliasValue = string | string[];
interface IWpwWebpackAliasConfig { [k: string]: WpwWebpackAliasValue | undefined }
type WpwWebpackAliasConfig = IWpwWebpackAliasConfig;

type WpwSourceTsConfigApp =  WpwSourceTsConfigFile & { config: WpwSourceTsConfig };


export {
    IWpwWebpackConfig,
    IWpwRuntimeEnvArgs,
    IWpwGetRcPathOptions,
    WpwCombinedRuntimeArgs,
    IWpwGlobalEnvironment,
    WpwGetAbsPathOptions,
    WpwGetRcPathOptions,
    WpwGetRelPathOptions,
    WpwRuntimeEnvArgs,
    WpwSourceDotExtensionApp,
    WpwSourceTsConfigApp,
    WpwWebpackConfig,
    IWpwWebpackAliasConfig,
    WpwWebpackAliasConfig,
    __WPWRAP__
};
