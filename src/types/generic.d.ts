
/**
 * @file types/generic.d.ts
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
 * Generic types and typings
 */

declare type AsArray<T = any> = T extends any[] ? T : [T];
// declare type ExtractTypings<T, V > = T extends V<infer X> ? X : never;
declare type PartialSome<T, K> = { [P in keyof T]: T[P] extends K | undefined ? Partial<T> : T };
declare type RequireKeys<T, K extends keyof T> = Required<Pick<T,K>> & Exclude<T, K>;
// declare type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
declare type PickByType<T, Value> = { [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P] };
declare type ConvertType<T, Type, NewType> = { [P in keyof T]: T[P] extends Type | undefined ? NewType : T[P] };
declare type ConvertTypeExcludeNon<T, Type, NewType> = { [P in keyof T as T[P] extends Type | undefined ? P : never]: NewType };
declare type ConvertType2<T, Type, NewType, Type2, NewType2> = { [P in keyof T]: T[P] extends Type | undefined ? NewType :  { [P in keyof T]: T[P] extends Type2 | undefined ? NewType2 : T[P] }};
declare type ConvertType3<T, K extends keyof T, NewType> = { [P in keyof T]: P extends K ? NewType : T[P] };

declare interface IDisposable { dispose: () => Required<void | PromiseLike<void>>; }

export {
    AsArray,
    ConvertType,
    ConvertType2,
    ConvertType3,
    ConvertTypeExcludeNon,
    // ExtractTypings,
    IDisposable,
    PartialSome,
    PickByType,
    RequireKeys
};
