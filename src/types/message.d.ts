

export declare enum WpwMessageCodePrefix { Error = "WPW", Info = "WPW", Reserved = "WPW", Warning = "WPW" }
export declare type WpwReservedCodePrefix = `${WpwMessageCodePrefix.Reserved}9`;
export declare type WpwErrorCodePrefix = `${WpwMessageCodePrefix.Error}${6|7|8}`;
export declare type WpwWarningCodePrefix = `${WpwMessageCodePrefix.Warning}${3|4|5}`;
export declare type WpwInfoCodePrefix = `${WpwMessageCodePrefix.Info}${0|1|2}`;
export declare type WpwErrorCode = `${WpwErrorCodePrefix}${number}${number}`;
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

export declare abstract class ClsWpwError
{
    static Msg: IWpwMessageEnum;
    static Msgs: IWpwMessage;
}

export declare interface IWpwError extends ClsWpwError {}
