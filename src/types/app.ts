// @ts-check

/**
 * @file src/types/app.ts
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
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpwPlugin`.
 *//** */

import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel, WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs, WebpackResolveOptions, WebpackPluginInstance, WebpackCompiler, WebpackInfrastructureLogging,
    WebpackMode, WebpackOutput, WebpackFileCacheOptions, WebpackMemoryCacheOptions, WebpackStatsOptions
} from "./webpack";
import {
    WpwWebpackEntry, WpwWebpackMode, WpwLoggerLevel, WebpackTarget, WpwSourceExtension
} from "./rc";


declare const __WPWRAP__: any;

interface IWpwGetRcPathOptions {
    build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string; fallback?: boolean;
};
type WpwGetRcPathOptions = IWpwGetRcPathOptions;

interface IWpwGlobalEnvironment {
    buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any;
};

interface IWpwRuntimeEnvArgs {
    analyze?: boolean; build?: string; mode?: WpwWebpackMode; loglevel?: WpwLoggerLevel | WebpackLogLevel;
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
    entry: WpwWebpackEntry & WebpackEntry;
    infrastructureLogging: WebpackInfrastructureLogging;
    output: WebpackOutput;
    plugins: (
		| undefined
		| ((this: WebpackCompiler, compiler: WebpackCompiler) => void)
		| WebpackPluginInstance
	)[];
    resolve: WebpackResolveOptions;
    stats: WebpackStatsOptions;
    target: WebpackTarget;
    module: WebpackModuleOptions;
}
type WpwWebpackConfig = IWpwWebpackConfig;

type WpwWebpackAliasValue = string | string[];
interface IWpwWebpackAliasConfig
{
    [k: string]: WpwWebpackAliasValue | undefined;
}
type WpwWebpackAliasConfig = IWpwWebpackAliasConfig;


export {
    IWpwWebpackConfig,
    IWpwRuntimeEnvArgs,
    IWpwGetRcPathOptions,
    WpwCombinedRuntimeArgs,
    IWpwGlobalEnvironment,
    WpwGetRcPathOptions,
    WpwRuntimeEnvArgs,
    WpwSourceDotExtensionApp,
    WpwWebpackConfig,
    IWpwWebpackAliasConfig,
    WpwWebpackAliasConfig,
    __WPWRAP__
};
