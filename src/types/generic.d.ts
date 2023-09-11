
/**
 * @file types/generic.d.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
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
 * Generic types and typings
 *//** */
import { WebpackError } from "webpack";
import { WpwWebpackConfig } from "./app";


declare type AsArray<T = any> = T extends any[] ? T : [T];
declare type ArrayInnerType<T> = T extends (infer U)[] ? U : never;
// declare type ExtractTypings<T, V > = T extends V<infer X> ? X : never;
declare type PartialSome<T, K> = { [P in keyof T]: T[P] extends K | undefined ? Partial<T> : T };
declare type RequireKeys<T, K extends keyof T> = Required<Pick<T,K>> & Exclude<T, K>;
// declare type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
declare type PickByType<T, Value> = { [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P] };
declare type ConvertType<T, Type, NewType> = { [P in keyof T]: T[P] extends Type | undefined ? NewType : T[P] };
declare type ConvertTypeExcludeNon<T, Type, NewType> = { [P in keyof T as T[P] extends Type | undefined ? P : never]: NewType };
declare type ConvertType2<T, Type, NewType, Type2, NewType2> = { [P in keyof T]: T[P] extends Type | undefined ? NewType :  { [P in keyof T]: T[P] extends Type2 | undefined ? NewType2 : T[P] }};
declare type ConvertType3<T, K extends keyof T, NewType> = { [P in keyof T]: P extends K ? NewType : T[P] };

declare interface IDisposable { dispose: () => Required<void | PromiseLike<void>> }

// declare type ConvertType4<T> = (str: string) => T;
// declare type Convertors<T, TE> = { [t in TE]: ConvertType4<T> };

// declare enum WpwErrorMessage
// {
//     WPW300 = ""
// }
//
// declare enum WpwWarningMessage
// {
//     WPW000 = "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false"
// }


declare class ClsWpwError extends WebpackError {
    static get(message: string, wpc?: Partial<WpwWebpackConfig> | undefined | null, detail?: string | undefined | null): ClsWpwError;
    static getErrorMissing: (property: string, wpc?: Partial<WpwWebpackConfig> | undefined | null, detail?: string | undefined | null) => ClsWpwError;
    static getErrorProperty: (property: string, wpc?: Partial<WpwWebpackConfig> | undefined | null, detail?: string | undefined | null) => ClsWpwError;
    constructor(message: string, details?: string, capture?: boolean);
    details: string | undefined;
    file: string | undefined;
}

declare interface MergeOptions<T, U>
{
    onlyIf: boolean;
    deepObj: boolean;
    deepArr: boolean;
    values: [ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]];
}


export {
    ArrayInnerType,
    AsArray,
    ConvertType,
    ConvertType2,
    ConvertType3,
    ConvertTypeExcludeNon,
    // ExtractTypings,
    IDisposable,
    MergeOptions,
    PartialSome,
    PickByType,
    RequireKeys,
    ClsWpwError
};
