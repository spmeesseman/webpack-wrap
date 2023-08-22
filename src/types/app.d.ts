
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
    WebpackResolveOptions, WebpackPluginInstance, WebpackCompiler
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

declare type WpBuildCombinedRuntimeArgs = WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs;


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
    tsConfig: WpBuildAppTsConfig | undefined;
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

export declare type WpBuildAppTsConfigPaths = { [k: string]: string[]; };

declare type WpBuildAppTsConfigCompilerOptions =
{
    target?: string;                        // Specify ECMAScript target version?: 'ES3' (default);'ES5';'ES2015';'ES2016';'ES2017';or 'ESNEXT'
    module?: string;                        // Specify module code generation: 'commonjs';'amd';'system';'umd' or 'es2015'
    lib?: string[];                         // Specify library files to be included in the compilation:  */
    allowJs?: boolean;                      // Allow javascript files to be compiled
    checkJs?: boolean;                      // Report errors in .js files
    jsx?: string;                           // Specify JSX code generation: 'preserve';'react-native';or 'react'
    declaration?: boolean;                  // Generates corresponding '.d.ts' file
    sourceMap?: boolean;                    // Generates corresponding '.map' file
    outFile?: string                        // Concatenate and emit output to single file
    outDir?: string;                        // Redirect output structure to the directory
    rootDir?: string;                       // Specify the root directory of input files. Use to control the output directory structure with --outDir
    removeComments?: boolean;               // Do not emit comments to output
    noEmit?: boolean;                       // Do not emit outputs
    importHelpers?: boolean;                // Import emit helpers from 'tslib'
    downlevelIteration?: boolean;           // Provide full support for iterables in 'for-of';spread;and destructuring when targeting 'ES5' or 'ES3'
    isolatedModules?: boolean;              // Transpile each file as a separate module (similar to 'ts.transpileModule')               
    strict?: boolean                        // Enable all strict type-checking options
    noImplicitAny?: boolean;                // Raise error on expressions and declarations with an implied 'any' type
    strictNullChecks?: boolean;             // Enable strict null checks
    noImplicitThis?: boolean;               // Raise error on 'this' expressions with an implied 'any' type
    alwaysStrict?: boolean;                 // Parse in strict mode and emit "use strict" for each source file                 
    noUnusedLocals?: boolean;               // Report errors on unused locals
    noUnusedParameters?: boolean;           // Report errors on unused parameters
    noImplicitReturns?: boolean;            // Report error when not all code paths in function return a value
    noFallthroughCasesInSwitch?: boolean;   // Report errors for fallthrough cases in switch statement               
    moduleResolution?: string;              // Specify module resolution strategy?: 'node' (Node.js) or 'classic' (TypeScript pre-1.6)
    baseUrl?:string;                        // Base directory to resolve non-absolute module names
    paths?: WpBuildAppTsConfigPaths;        // A series of entries which re-map imports to lookup locations relative to the 'baseUrl'
    rootDirs?: string[];                    // List of root folders whose combined content represents the structure of the project at runtime
    typeRoots?: string[];                   // List of folders to include type definitions from
    types?: string[];                       // Type declaration files to be included in compilation
    allowSyntheticDefaultImports?: boolean; // Allow default imports from modules with no default export. This does not affect code emit;just typechecking                           
    sourceRoot?: string;                    // Specify the location where debugger should locate TypeScript files instead of source locations
    mapRoot?: string;                       // Specify the location where debugger should locate map files instead of generated locations
    inlineSourceMap?: boolean;              // Emit a single file with source maps instead of having a separate file
    inlineSources?: boolean;                // Emit the source alongside the sourcemaps within a single file; requires '--inlineSourceMap' or '--sourceMap' to be set
    experimentalDecorators?: boolean;       // Enables experimental support for ES7 decorators
    emitDecoratorMetadata?:  boolean;       // Enables experimental support for emitting type metadata for decorators
    incremental?: boolean;
    declarationsDir?: string;
    declarationsOnly?: boolean;
    declarationMap?: boolean;
    tsBuildInfoFile?: string;
}

declare type WpBuildAppTsConfigJson =
{
    compilerOptions: WpBuildAppTsConfigCompilerOptions;
    exclude: string[];
    files: string[];
    include: string[];
    extends?: string | string[];
}

declare type WpBuildAppTsConfig =
{
    dir: string;
    excludeAbs: string[];
    file: string;
    includeAbs: string[];
    json: WpBuildAppTsConfigJson;
    path: string;
    raw: string;
};

export {
    ClsWpBuildApp,
    IWpBuildApp,
    IWpBuildAppSchema,
    WpBuildCombinedRuntimeArgs,
    WpBuildRcBuildModeConfigBase,
    WpBuildAppGetPathOptions,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildAppTsConfig,
    WpBuildAppTsConfigJson,
    WpBuildAppTsConfigCompilerOptions,
    WpBuildWebpackConfig,
    __WPBUILD__
};
