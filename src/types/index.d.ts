
/**
 * @file types/index.d.ts
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
 * Collectively exports all Wpw types
 *
 *//** */

/**
 * Typescript symbol sham
 * @returns {boolean}
 */
export declare function hasSymbolSham(): boolean;

/**
 * App typings
 */
export * from "./app";
/**
 * Base typings
 */
export * from "./base";
/**
 * Wpw application specific types library
 */
export * from "./export";
/**
 * Generic typings
 */
export * from "./generic";
/**
 * Log typings
 */
export * from "./logger";
/**
 * Error / Info / Warning messages
 */
export * from "./message";
/**
 * Wpw application specific types library
 */
export * from "./plugin";
/**
 * Wpw application specific types library
 */
export * from "./rc";
/**
 * Base webpack types library
 */
export * from "./webpack";
// import * as wp from "./webpack";
