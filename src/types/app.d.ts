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
 * RC DEFAULTS    : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 *
 * @description
 *
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpwPlugin`.
 *//** */

import { IWpwLogger } from "./logger";
import { WpwErrorCode, WpwInfoCode, WpwWarningCode } from "./message";
import { IDisposable, ClsWpBuildError } from "./generic";
import {
    EmitResult, CustomTransformers, CancellationToken, CompilerOptions, WriteFileCallback, SourceFile
} from "typescript";
import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel, WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs, WebpackResolveOptions, WebpackPluginInstance, WebpackCompiler,
    WebpackMode, WebpackOutput, WebpackFileCacheOptions, WebpackMemoryCacheOptions, WebpackCompilation
} from "./webpack";
import {
    WpwWebpackEntry, WpwWebpackMode, WpwLoggerLevel, WpwBuild, WebpackTarget, WpwRcPathsKey,
    WpwBuildModeConfig, IWpwRcSchema, WpwSourceCode, WpwVsCode, WpwPackageJson, IWpwSourceCode
} from "./rc";


declare const __WPBUILD__: any;

declare interface IWpBuildAppGetPathOptions {
    build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string;
};
declare type WpBuildAppGetPathOptions = IWpBuildAppGetPathOptions;

declare interface IWpBuildGlobalEnvironment {
    buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any;
};
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment;

declare interface IWpBuildRuntimeEnvArgs {
    analyze?: boolean; build?: string; mode?: WpwWebpackMode; loglevel?: WpwLoggerLevel | WebpackLogLevel;
};
declare type WpBuildRuntimeEnvArgs = IWpBuildRuntimeEnvArgs;

declare type WpwBuildModeConfigBase = Omit<WpwBuildModeConfig, "builds">;

// declare interface WpBuildRModeConfig extends WpBuildRModeConfig {};

declare type WpBuildCombinedRuntimeArgs =
    WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs & { mode: WpwWebpackMode | Exclude<WebpackMode, undefined> };

declare interface IWpwSourceCodeApp extends IWpwSourceCode
{
    emit: (file?: SourceFile, writeFileCb?: WriteFileCallback, cancellationToken?: CancellationToken, emitOnlyDts?: boolean, transformers?: CustomTransformers) => EmitResult | undefined;
}

declare interface IWpBuildApp extends IDisposable
{
    build: WpwBuild;
    buildCount: number;
    disposables: IDisposable[];
    cmdLine: WpBuildCombinedRuntimeArgs;
    errors: ClsWpBuildError[];
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    info: ClsWpBuildError[];
    isOnlyBuild: boolean;
    isMain: boolean;
    isMainProd: boolean;
    isMainTest: boolean;
    isTest: boolean;
    isWeb: boolean;
    logger: IWpwLogger;
    mode: WpwWebpackMode;
    pkgJson: WpwPackageJson;
    target: WebpackTarget;
    vscode: WpwVsCode;
    warnings: ClsWpBuildError[];
    wpc: WpwWebpackConfig;
    addError(e: WpwErrorCode, c?: WebpackCompilation, d?: string, pad?: string): void;
    addInfo(i: WpwInfoCode, d?: string, pad?: string): void;
    addWarning(w: WpwWarningCode, c?: WebpackCompilation, d?: string, pad?: string): void;
    buildApp(): WpwWebpackConfig;
    dispose(): Promise<void>;
    getApp(name: string): IWpBuildApp | undefined;
    getAppBuild(name: string): WpwBuild | undefined;
    getBasePath<P extends WpBuildAppGetPathOptions | undefined, R extends P extends { stat: true } ? string | undefined : string>(arg: P): R;
    getContextPath<P extends WpBuildAppGetPathOptions | undefined, R extends P extends { stat: true } ? string | undefined : string>(arg: P): R;
    getDistPath<P extends WpBuildAppGetPathOptions | undefined, R extends P extends { stat: true } ? string | undefined : string>(arg: P): R;
    getRcPath<P extends WpBuildAppGetPathOptions | undefined, R extends P extends { stat: true } ? string | undefined : string>(key: WpwRcPathsKey, arg: P): R;
    getSrcPath<P extends WpBuildAppGetPathOptions | undefined, R extends P extends { stat: true } ? string | undefined : string>(arg: P): R;
}

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
    IWpBuildApp,
    IWpwSourceCodeApp,
    IWpwWebpackConfig,
    IWpBuildRuntimeEnvArgs,
    IWpBuildAppGetPathOptions,
    WpBuildCombinedRuntimeArgs,
    IWpBuildGlobalEnvironment,
    WpwBuildModeConfigBase,
    WpBuildAppGetPathOptions,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpwWebpackConfig,
    __WPBUILD__
};
