
/**
 * @file types/index.d.ts
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
 * Exports all types for this project
 *
 * All types exported from this definition file are prepended with `WpBuild`.
 */

/**
 * App typings
 */
export * from "./app";

/**
 * Generic typings
 */
export * from "./generic";

/**
 * Log typings
 */
export * from "./logger";

/**
 * WpBuild application specific types library
 */
export * from "./plugin";

/**
 * WpBuild application specific types library
 */
export * from "./rc";

/**
 * WpBuild application specific types library
 */
// export * from "./rc.base";

/**
 * Base webpack types library
 */
export * from "./webpack";
// import * as wp from "./webpack";


// export * from "./constants";
// const {/* START_CONST_DEFS */ isWebpackMode, isWebpackTarget, isWpBuildLogColor, isWpBuildLogTrueColor, isWpBuildRcBuildType, isWpBuildRcPathsProp, isWpBuildRcSourceCodeType, isWpBuildWebpackMode, WebpackModes, WebpackTargets, WpBuildLogColors, WpBuildLogTrueColors, WpBuildRcBuildTypes, WpBuildRcPathsEnum, WpBuildRcPathsProps, WpBuildRcSourceCodeTypes, WpBuildWebpackModes /* END_CONST_DEFS */} = require("./constants");
