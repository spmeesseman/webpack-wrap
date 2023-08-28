
/**
 * @file types/app.d.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES: file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\types.d.ts
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 *
 * @description
 *
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpBuildPlugin`.
 */

import { IDisposable } from "./generic";
import { IWpBuildLogger } from "./logger";
import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel, WebpackRuntimeArgs, WebpackRuntimeEnvArgs,
    WebpackResolveOptions, WebpackPluginInstance, WebpackCompiler, WebpackMode
} from "./webpack";
import {
    WpwRcPaths, WpwWebpackEntry, WpwWebpackMode, WpBuildLogLevel, WpwBuild, WebpackTarget, WpwRcPathsKey,
    WpwBuildModeConfig, IWpwRcSchema, WpwSourceCode, WpwVsCodeConfig, WpBuildRcPackageJson
} from "./rc";


declare const __WPBUILD__: any;

declare type WpBuildAppGetPathOptions = { build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string };

declare type WpBuildGlobalEnvironment = { buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any };

declare type WpBuildRuntimeEnvArgs =  { analyze?: boolean; build?: string; mode?: WpwWebpackMode; loglevel?: WpBuildLogLevel | WebpackLogLevel };

declare type WpwBuildModeConfigBase = Omit<WpwBuildModeConfig, "builds">;

// declare interface WpBuildRModeConfig extends WpBuildRModeConfig {};

declare type WpBuildCombinedRuntimeArgs = WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs & { mode: WpwWebpackMode | Exclude<WebpackMode, undefined> };

declare interface IWpBuildAppSchema extends IWpwRcSchema
{
    args: WpBuildCombinedRuntimeArgs
}

declare interface IWpBuildApp extends IDisposable
{
    build: WpwBuild;
    disposables: IDisposable[];
    cmdLine: WpBuildCombinedRuntimeArgs;
    errors: Error[];
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    isMain: boolean;
    isMainProd: boolean;
    isMainTest: boolean;
    isTest: boolean;
    isWeb: boolean;
    logger: IWpBuildLogger;
    pkgJson: WpBuildRcPackageJson;
    source: WpwSourceCode;
    target: WebpackTarget;
    vscode: WpwVsCodeConfig;
    warnings: Error[];
    wpc: WpwWebpackConfig;
    addError: (e: WpBuildError | string, pad: string) => void;
    addWarning: (w: WpBuildError | string, pad: string) => void;
    buildApp: () => WpwWebpackConfig;
    dispose: () => Promise<void>;
    getApp: (name: string) => WpBuildApp | undefined;
    getAppBuild: (name: string) => WpwBuild | undefined;
    getBasePath: <P extends WpBuildAppGetPathOptions | undefined, R extends string | undefined = P extends { stat: true } ? string | undefined : string>(arg: P) => R;
    getContextPath: <P extends WpBuildAppGetPathOptions | undefined, R extends string | undefined = P extends { stat: true } ? string | undefined : string>(arg: P) => R;
    getDistPath: <P extends WpBuildAppGetPathOptions | undefined, R extends string | undefined = P extends { stat: true } ? string | undefined : string>(arg: P) => R;
    getRcPath: <P extends WpBuildAppGetPathOptions | undefined, R extends string | undefined = P extends { stat: true } ? string | undefined : string>(key: WpwRcPathsKey, arg: P) => R;
    getSrcPath: <P extends WpBuildAppGetPathOptions | undefined, R extends string | undefined = P extends { stat: true } ? string | undefined : string>(arg: P) => R;
}

declare class ClsWpBuildApp implements IWpBuildApp
{
    private applyAppRc;
    private buildWebpackConfig;
    private initLogger;
    private printBuildProperties;
    private printNonFatalIssue;
    private printWpcProperties;
    private rc: IWpBuildAppSchema;
    constructor(rc: WpBuildRc, build: WpwBuild);
}

declare interface IWpwWebpackConfig extends WebpackConfig
{
    context: string;
    mode: Exclude<WebpackConfig["mode"], undefined>;
    entry: WpwWebpackEntry & WebpackEntry;
    output: Exclude<WebpackConfig["output"], undefined>;
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
    ClsWpBuildApp,
    IWpBuildApp,
    IWpBuildAppSchema,
    WpBuildCombinedRuntimeArgs,
    WpwBuildModeConfigBase,
    WpBuildAppGetPathOptions,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildAppJsTsConfig,
    WpBuildAppJsTsConfigJson,
    WpBuildAppJsTsConfigCompilerOptions,
    WpwWebpackConfig,
    __WPBUILD__
};
