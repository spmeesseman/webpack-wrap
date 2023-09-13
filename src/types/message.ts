
import { IWpwWebpackConfig } from "./app";
import { WebpackCompilation, WebpackError, WebpackDependencyLocation } from "./webpack";


export type WpwMessageType = import("../utils/message");

export enum WpwMessageCodePrefix { Error = "WPW", Info = "WPW", Reserved = "WPW", Warning = "WPW" }

export type WpwErrorCodeBuildTypesPrefix = `${WpwErrorCodePrefix}${number}${number}`;

export type WpwReservedCodePrefix = `${WpwMessageCodePrefix.Reserved}9`;

export type WpwErrorCodePrefix = `${WpwMessageCodePrefix.Error}${6|7|8}`;

export type WpwWarningCodePrefix = `${WpwMessageCodePrefix.Warning}${3|4|5}`;

export type WpwInfoCodePrefix = `${WpwMessageCodePrefix.Info}${0|1|2}`;

export type WpwErrorCode = `${WpwErrorCodePrefix}${number}${number}`;

// export type WpwErrorCodeBuildTypes= `${WpwMessageCodePrefix.Error}6${6|7}${number}`;

export type WpwWarningCode = `${WpwWarningCodePrefix}${number}${number}`;

export type WpwInfoCode = `${WpwInfoCodePrefix}${number}${number}`;

export type WpwReservedCode = `${WpwReservedCodePrefix}${number}${number}`;

export type WpwMessageCode = WpwErrorCode | WpwWarningCode | WpwInfoCode | WpwReservedCode;

export type WpwMessageText = string;

export interface IWpwMessage
{
    [ key: WpwMessageCode ]: WpwMessageText;
}

export type WpwMessageKey = keyof IWpwMessage;

export interface IWpwMessageEnum
{
    [ key: string ]: WpwMessageCode;
}

export interface WpwMessageInfo
{
    code: WpwMessageCode;
    compilation?: WebpackCompilation;
    detail?: string;
    detailObject?: Record<string, any>;
    error?: WpwMessageType | WebpackError | Error | undefined;
    message: string;
    pad?: string;
    wpc?: IWpwWebpackConfig | Partial<IWpwWebpackConfig> | null;
}
export type WpwMessageInfoKey = keyof WpwMessageInfo;

export interface WpwWebpackError extends WebpackError
{
    loc?: WebpackDependencyLocation;
}
