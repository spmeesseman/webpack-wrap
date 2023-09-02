export declare enum WpwMessageCodePrefix {
    Error = "WPW",
    Info = "WPW",
    Reserved = "WPW",
    Warning = "WPW"
}
export type WpwReservedCodePrefix = `${WpwMessageCodePrefix.Reserved}9`;
export type WpwErrorCodePrefix = `${WpwMessageCodePrefix.Error}${6 | 7 | 8}`;
export type WpwWarningCodePrefix = `${WpwMessageCodePrefix.Warning}${3 | 4 | 5}`;
export type WpwInfoCodePrefix = `${WpwMessageCodePrefix.Info}${0 | 1 | 2}`;
export type WpwErrorCode = `${WpwErrorCodePrefix}${number}${number}`;
export type WpwWarningCode = `${WpwWarningCodePrefix}${number}${number}`;
export type WpwInfoCode = `${WpwInfoCodePrefix}${number}${number}`;
export type WpwReservedCode = `${WpwReservedCodePrefix}${number}${number}`;
export type WpwMessageCode = WpwErrorCode | WpwWarningCode | WpwInfoCode | WpwReservedCode;
export declare enum WpwMessage {
    WPW650 = "failed to modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    WPW899 = "an unknown error has occurred",
    WPW050 = "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false"
}
export type WpwMessageKey = keyof typeof WpwMessage;
