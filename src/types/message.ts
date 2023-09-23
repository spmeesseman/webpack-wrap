/**
 * @file src/types/message.ts
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * Handy file links:
 *
 * WEBPACK TYPES  : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\types.d.ts
 * COMPILER       : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\Compiler.js
 * TAPABLE        : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\tapable\tapable.d.ts
 *
 *//** */

import { IWpwBuildConfig } from "./rc";
import { IWpwWebpackConfig } from "./app";
import { WebpackCompilation, WebpackError, WebpackDependencyLocation } from "./webpack";


type WpwMessageCls = import("../utils/message");

type WpwMessageType = "error" | "info" | "warning";

enum WpwMessageCodePrefix { Error = "WPW", Info = "WPW", Reserved = "WPW", Warning = "WPW" }

type WpwErrorCodeBuildTypesPrefix = `${WpwErrorCodePrefix}${number}${number}`;

type WpwReservedCodePrefix = `${WpwMessageCodePrefix.Reserved}9`;

type WpwErrorCodePrefix = `${WpwMessageCodePrefix.Error}${6|7|8}`;

type WpwWarningCodePrefix = `${WpwMessageCodePrefix.Warning}${3|4|5}`;

type WpwInfoCodePrefix = `${WpwMessageCodePrefix.Info}${0|1|2}`;

type WpwErrorCode = `${WpwErrorCodePrefix}${number}${number}`;

type WpwWarningCode = `${WpwWarningCodePrefix}${number}${number}`;

type WpwInfoCode = `${WpwInfoCodePrefix}${number}${number}`;

type WpwReservedCode = `${WpwReservedCodePrefix}${number}${number}`;

type WpwMessageCode = WpwErrorCode | WpwWarningCode | WpwInfoCode | WpwReservedCode;

type WpwMessageText = string;

interface IWpwMessageMap
{
    [ key: WpwMessageCode ]: WpwMessageText;
}

interface IWpwMessageEnum
{
    [ key: string ]: WpwMessageCode;
}

interface IWpwMessageInfo
{
    capture?: any;
    code: WpwMessageCode;
    build?: IWpwBuildConfig;
    compilation?: WebpackCompilation;
    detail?: string;
    detailObject?: Record<string, any>;
    error?: WpwMessageCls | WebpackError | Error | undefined;
    message: string;
    pad?: string;
    suggest?: string | string[];
    wpc?: IWpwWebpackConfig | Partial<IWpwWebpackConfig> | null;
}
type WpwMessageInfo = IWpwMessageInfo;
// type WpwMessageInfo = NoExtraProperties<IWpwMessageInfo>;
type WpwMessageInfoKey = keyof WpwMessageInfo;


export {
    IWpwMessageEnum,
    IWpwMessageInfo,
    IWpwMessageMap,
    WpwMessageType,
    WpwErrorCodeBuildTypesPrefix,
    WpwReservedCodePrefix,
    WpwErrorCodePrefix,
    WpwWarningCodePrefix,
    WpwInfoCodePrefix,
    WpwErrorCode,
    WpwWarningCode,
    WpwInfoCode,
    WpwReservedCode,
    WpwMessageCode,
    WpwMessageText,
    WpwMessageInfo,
    WpwMessageInfoKey
};

