
/**
 * @file src/types/index.ts
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
 * Wpw schema helper definitions
 */
export * from "./schema";
/**
 * Base webpack types library
 */
export * from "./webpack";
// import * as wp from "./webpack";
