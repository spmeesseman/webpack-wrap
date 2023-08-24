
/**
 * @file types/app.d.ts
 * @version 0.0.1
 * @license MIT
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
    WpBuildRcPaths, WpBuildWebpackEntry, WpBuildWebpackMode, WpBuildLogLevel, WpBuildRcBuild, WebpackTarget,
    WpBuildRcBuildModeConfig, IWpBuildRcSchema
} from "./rc";


declare const __WPBUILD__: any;

declare type WpBuildAppGetPathOptions = { build?: string; rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; path?: string };

declare type WpBuildGlobalEnvironment = { buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any };

declare type WpBuildRuntimeEnvArgs =  { analyze?: boolean; build?: string; mode?: WpBuildWebpackMode; loglevel?: WpBuildLogLevel | WebpackLogLevel };

declare type WpBuildRcBuildModeConfigBase = Omit<WpBuildRcBuildModeConfig, "builds">;

// declare interface WpBuildRModeConfig extends WpBuildRModeConfig {};

declare type WpBuildCombinedRuntimeArgs = WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs & { mode: WpBuildWebpackMode | Exclude<WebpackMode, undefined> };


declare interface IWpBuildAppSchema extends IWpBuildRcSchema
{
    args: WpBuildCombinedRuntimeArgs
}

declare interface IWpBuildApp extends IDisposable
{
    build: WpBuildRcBuild;
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    logger: IWpBuildLogger;
    rc: IWpBuildAppSchema;          // target js app info
    target: WebpackTarget;
    jstsConfig: WpBuildAppJsTsConfig | undefined;
    wpc: WpBuildWebpackConfig;
}

declare class ClsWpBuildApp
{
    analyze: boolean;                 // parform analysis after build
    build: WpBuildRcBuild;
    clean: boolean;
    disposables: Array<IDisposable>;
    esbuild: boolean;                 // Use esbuild and esloader
    imageOpt: boolean;                // Perform image optimization
    isMain: boolean;
    isMainProd: boolean;
    isMainTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    logger: IWpBuildLogger;
    paths: WpBuildRcPaths;
    rc: IWpBuildRcSchema;           // target js app info
    target: WebpackTarget;
    wpc: WpBuildWebpackConfig;
    mode: WpBuildWebpackMode;
    dispose: () => void;
    private wpApp;
    private getPaths;
    private resolveRcPaths;
}

declare interface IWpBuildWebpackConfig extends WebpackConfig
{
    context: string;
    mode: Exclude<WebpackConfig["mode"], undefined>;
    entry: WpBuildWebpackEntry & WebpackEntry;
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
declare type WpBuildWebpackConfig = IWpBuildWebpackConfig;


export {
    ClsWpBuildApp,
    IWpBuildApp,
    IWpBuildAppSchema,
    WpBuildCombinedRuntimeArgs,
    WpBuildRcBuildModeConfigBase,
    WpBuildAppGetPathOptions,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildAppJsTsConfig,
    WpBuildAppJsTsConfigJson,
    WpBuildAppJsTsConfigCompilerOptions,
    WpBuildWebpackConfig,
    __WPBUILD__
};
