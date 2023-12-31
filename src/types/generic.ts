
/**
 * @file src/types/generic.ts
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\tapable\tapable.d.ts
 *
 * @description
 *
 * Generic types and typings
 *//** */

type AsArray<T = any> = T extends any[] ? T : [T];
type ArrayInnerType<T> = T extends (infer U)[] ? U : never;
// type ExtractTypings<T, V > = T extends V<infer X> ? X : never;
type PartialSome<T, K> = { [P in keyof T]: T[P] extends K | undefined ? Partial<T> : T };
type RequireKeys<T, K extends keyof T> = Required<Pick<T,K>> & Exclude<T, K>;
// type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
type PickByType<T, Value> = { [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P] };
type ConvertType<T, Type, NewType> = { [P in keyof T]: T[P] extends Type | undefined ? NewType : T[P] };
type ConvertTypeExcludeNon<T, Type, NewType> = { [P in keyof T as T[P] extends Type | undefined ? P : never]: NewType };
type ConvertType2<T, Type, NewType, Type2, NewType2> = { [P in keyof T]: T[P] extends Type | undefined ? NewType :  { [P in keyof T]: T[P] extends Type2 | undefined ? NewType2 : T[P] }};
type ConvertType3<T, K extends keyof T, NewType> = { [P in keyof T]: P extends K ? NewType : T[P] };
type Impossible<K extends keyof any> = { [P in K]: never; };
type NoExtraProperties<T, U extends T = T> = U extends (infer V)[] ? NoExtraProperties<V>[] : U & Impossible<Exclude<keyof U, keyof T>>;

interface IDisposable { dispose: () => Required<void | PromiseLike<void>> }

interface ExecAsyncResult { code: number | null; errors: string[]; stdout: string }


export {
    ArrayInnerType,
    AsArray,
    ConvertType,
    ConvertType2,
    ConvertType3,
    ConvertTypeExcludeNon,
    ExecAsyncResult,
    // ExtractTypings,
    IDisposable,
    Impossible,
    NoExtraProperties,
    PartialSome,
    PickByType,
    RequireKeys
};
