// @ts-check

/**
 * @file types/app.d.ts
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
 *
 * @description
 *
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpwPlugin`.
 *//** */

import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel, WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs, WebpackResolveOptions, WebpackPluginInstance, WebpackCompiler,
    WebpackMode, WebpackOutput, WebpackFileCacheOptions, WebpackMemoryCacheOptions
} from "./webpack";
import {
    WpwWebpackEntry, WpwWebpackMode, WpwLoggerLevel, WebpackTarget, WpwBuildBaseConfig, WpwSourceCodeExtension
} from "./rc";


declare const __WPBUILD__: any;

declare interface IWpBuildAppGetPathOptions {
    build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string;
};
declare type WpBuildAppGetPathOptions = IWpBuildAppGetPathOptions;

declare interface IWpwGlobalEnvironment {
    buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any;
};

declare interface IWpBuildRuntimeEnvArgs {
    analyze?: boolean; build?: string; mode?: WpwWebpackMode; loglevel?: WpwLoggerLevel | WebpackLogLevel;
};
declare type WpBuildRuntimeEnvArgs = IWpBuildRuntimeEnvArgs;

declare type WpwBuildModeConfigBase = Omit<WpwBuildBaseConfig, "builds">;

// declare interface WpBuildRModeConfig extends WpBuildRModeConfig {};

declare type WpBuildCombinedRuntimeArgs =
    WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs & { mode: WpwWebpackMode | Exclude<WebpackMode, undefined> };

declare type WpwSourceCodeDotExtensionApp = `.${WpwSourceCodeExtension}`;


declare interface IWpwWebpackConfig extends WebpackConfig
{
    cache: WebpackFileCacheOptions | WebpackMemoryCacheOptions;
    context: string;
    mode: Exclude<WebpackConfig["mode"], undefined>;
    entry: WpwWebpackEntry & WebpackEntry;
    output: WebpackOutput;
    plugins: (
		| undefined
		| ((this: WebpackCompiler, compiler: WebpackCompiler) => void)
		| WebpackPluginInstance
	)[];
    resolve: WebpackResolveOptions;
    target: WebpackTarget;
    module: WebpackModuleOptions;
}
declare type WpwWebpackConfig = IWpwWebpackConfig;


export {
    IWpwWebpackConfig,
    IWpBuildRuntimeEnvArgs,
    IWpBuildAppGetPathOptions,
    WpBuildCombinedRuntimeArgs,
    IWpwGlobalEnvironment,
    WpwBuildModeConfigBase,
    WpBuildAppGetPathOptions,
    WpBuildRuntimeEnvArgs,
    WpwSourceCodeDotExtensionApp,
    WpwWebpackConfig,
    __WPBUILD__
};
