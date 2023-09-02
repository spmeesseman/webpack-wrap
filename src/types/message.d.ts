

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

export declare enum WpwMessage
{
    WPW650 = "failed to modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    WPW899 = "an unknown error has occurred",
    WPW050 = "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false"
}
export declare type WpwMessageKey = keyof typeof WpwMessage;
