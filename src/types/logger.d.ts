
/**
 * @file types/log.d.ts
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
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */


import { WpwLoggerLevel, WpwLogTrueColor, WpwLogColor, WpwLog } from "./rc";

declare type WpwLoggerIcon = keyof Omit<WpwLoggerIconSet, "blue" | "color">;
declare type WpwLoggerBlueIcon = keyof WpwLoggerIconBlueSet;
declare type WpwLoggerColorIcon = keyof WpwLoggerIconColorSet;

declare type WpwLogColorValue = 0 | 1 | 3 | 4 | 7 | 22 | 23 | 24 | 27 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 39 | 90;

declare type WpwLogColorMapping = [ WpwLogColorValue, WpwLogColorValue ];

declare type WpwLogIconString = `${string}`;
declare type WpwLogIconString2 = `${string}${keyof WpwLoggerIconBaseSet}${string}`;

declare interface IWpwLoggerIconBaseSet
{
    bullet: WpwLogIconString;
    error: WpwLogIconString;
    info: WpwLogIconString;
    star: WpwLogIconString;
    start: WpwLogIconString;
    success: WpwLogIconString;
    up: WpwLogIconString;
    warning: WpwLogIconString;
};
declare type WpwLoggerIconBaseSet = IWpwLoggerIconBaseSet;

declare type WpwLoggerIconBlueSet = Pick<WpwLoggerIconBaseSet, "error"|"info"|"success"|"warning">;

declare type WpwLoggerIconColorSet =
{
    errorTag: WpwLogIconString;
    infoTag: WpwLogIconString;
    starCyan: WpwLogIconString;
    successTag: WpwLogIconString;
    warningTag: WpwLogIconString;
} & WpwLoggerIconBaseSet;

declare type WpwLoggerIconSet =
{
    blue: WpwLoggerIconBlueSet;
    color: WpwLoggerIconColorSet;
} & WpwLoggerIconBaseSet;

declare interface IWpwLogger
{
    colors: Record<WpwLogColor, WpwLogColorMapping>;
    icons: WpwLoggerIconSet;
    withColor(msg: string | undefined, color: WpwLogColorMapping, sticky?: boolean): string;
    error: (msg: any, pad?: string) => void;
    start: (msg: string, level?: WpwLoggerLevel) => void;
    tag: (msg: string, bracketColor?: WpwLogColorMapping | null, msgColor?: WpwLogColorMapping | null) => void;
    value: (msg: string, value: any, level?: WpwLoggerLevel, pad?: string, icon?: WpwLogIconString | undefined | null | 0 | false, color?: WpwLogColorMapping | null) => void;
    valuestar: (msg: string, value: any, level?: WpwLoggerLevel, pad?: string, iconColor?: WpwLogColorMapping | null, msgColor?: WpwLogColorMapping | null) => void;
    warning: (msg: any, pad?: string) => void;
    write: (msg: string, level?: WpwLoggerLevel, pad?: string, icon?: WpwLogIconString | undefined | null | 0 | false, color?: WpwLogColorMapping | null) => void;
    writeMsgTag: (msg: string, tagMsg: string, level?: WpwLoggerLevel, pad?: string, bracketColor?: WpwLogColorMapping | null, msgColor?: WpwLogColorMapping | null) => void;
}

declare type WpwLoggerOptions = Partial<WpwLog>;


export {
    IWpwLogger,
    IWpwLoggerIconBaseSet,
    WpwLoggerIconBlueSet,
    WpwLoggerIconColorSet,
    WpwLogColor,
    WpwLogColorMapping,
    WpwLogColorValue,
    WpwLoggerIcon,
    WpwLoggerIconSet,
    WpwLoggerLevel,
    WpwLogTrueColor
};
