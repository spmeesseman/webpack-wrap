
import { IWpwWebpackConfig } from "./rc";
import { WebpackError } from "./webpack";


export declare type WpwMessageType = import("../utils/message");

export declare enum WpwMessageCodePrefix { Error = "WPW", Info = "WPW", Reserved = "WPW", Warning = "WPW" }

export declare type WpwErrorCodeBuildTypesPrefix = `${WpwErrorCodePrefix}${number}${number}`;

export declare type WpwReservedCodePrefix = `${WpwMessageCodePrefix.Reserved}9`;

export declare type WpwErrorCodePrefix = `${WpwMessageCodePrefix.Error}${6|7|8}`;

export declare type WpwWarningCodePrefix = `${WpwMessageCodePrefix.Warning}${3|4|5}`;

export declare type WpwInfoCodePrefix = `${WpwMessageCodePrefix.Info}${0|1|2}`;

export declare type WpwErrorCode = `${WpwErrorCodePrefix}${number}${number}`;

// export declare type WpwErrorCodeBuildTypes= `${WpwMessageCodePrefix.Error}6${6|7}${number}`;

export declare type WpwWarningCode = `${WpwWarningCodePrefix}${number}${number}`;

export declare type WpwInfoCode = `${WpwInfoCodePrefix}${number}${number}`;

export declare type WpwReservedCode = `${WpwReservedCodePrefix}${number}${number}`;

export declare type WpwMessageCode = WpwErrorCode | WpwWarningCode | WpwInfoCode | WpwReservedCode;

export declare type WpwMessageText = string;

export declare interface IWpwMessage
{
    [ key: WpwMessageCode ]: WpwMessageText;
}

export declare type WpwMessageKey = keyof IWpwMessage;

export declare interface IWpwMessageEnum
{
    [ key: string ]: WpwMessageCode;
}

export declare interface IWpwMessageInfo<E extends Error | undefined>
{
    code: WpwMessageCode;
    detail?: string;
    detailObject?: Record<string, any>;
    error?: E;
    message: string;
    wpc?: IWpwWebpackConfig;
}
export declare type WpwMessageInfo = IWpwMessageInfo<WpwMessageType | WebpackError | Error | undefined>;
export declare type WpwMessageInfoKey = keyof IWpwMessageInfo;

export declare abstract class ClsWpwError
{
    static Msg: IWpwMessageEnum;
}

export declare interface IWpwError extends ClsWpwError {}
