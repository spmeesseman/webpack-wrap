
/**
 * @file types/log.d.ts
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
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */


import { WpBuildLogLevel, WpBuildLogTrueColor, WpBuildLogColor } from "./rc";

declare type WpBuildLogIcon = keyof Omit<WpBuildLogIconSet, "blue" | "color">;

declare type WpBuildLogColorValue = 0 | 1 | 3 | 4 | 7 | 22 | 23 | 24 | 27 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 39 | 90;

declare type WpBuildLogColorMapping = [ WpBuildLogColorValue, WpBuildLogColorValue ];

declare type WpBuildLogIconBaseSet =
{
    bullet: string;
    error: string;
    info: string;
    star: string;
    start: string;
    success: string;
    up: string;
    warning: string;
};

declare type WpBuildLogIconBlueSet = Pick<WpBuildLogIconBaseSet, "error"|"info"|"success"|"warning">;

declare type WpBuildLogIconActionSet =
{
    errorTag: string;
    starCyan: string;
    successTag: string;
} & WpBuildLogIconBaseSet;

declare type WpBuildLogIconSet = 
{
    blue: WpBuildLogIconBlueSet;
    color: WpBuildLogIconActionSet;
} & WpBuildLogIconBaseSet;

declare interface IWpBuildLogger
{
    colors: Record<WpBuildLogColor, WpBuildLogColorMapping>;
    icons: WpBuildLogIconSet;
    withColor(msg: string | undefined, color: WpBuildLogColorMapping, sticky?: boolean): string;
    error: (msg: any, pad?: string) => void;
    start: (msg: string, level?: WpBuildLogLevel) => void;
    tag: (msg: string, bracketColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
    value: (msg: string, value: any, level?: WpBuildLogLevel, pad?: string, icon?: string | undefined | null | 0 | false, color?: WpBuildLogColorMapping | null) => void;
    valuestar: (msg: string, value: any, level?: WpBuildLogLevel, pad?: string, iconColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
    warning: (msg: any, pad?: string) => void;
    write: (msg: string, level?: WpBuildLogLevel, pad?: string, icon?: string | undefined | null | 0 | false, color?: WpBuildLogColorMapping | null) => void;
    writeMsgTag: (msg: string, tagMsg: string, level?: WpBuildLogLevel, pad?: string, bracketColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
}

export {
    IWpBuildLogger,
    WpBuildLogColor,
    WpBuildLogColorMapping,
    WpBuildLogColorValue,
    WpBuildLogIcon,
    WpBuildLogIconSet,
    WpBuildLogLevel,
    WpBuildLogTrueColor
};
