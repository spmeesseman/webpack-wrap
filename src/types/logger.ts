
/**
 * @file src/types/logger.ts
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
 *
 *//** */

import { WpwLoggerLevel, WpwLogTrueColor, WpwLogColor, WpwLog } from "./rc";

type WpwLoggerIcon = keyof Omit<WpwLoggerIconSet, "blue" | "color">;
// type WpwLoggerBlueIcon = keyof WpwLoggerIconBlueSet;
// type WpwLoggerColorIcon = keyof WpwLoggerIconColorSet;

type WpwLogColorValue = 0 | 1 | 3 | 4 | 7 | 22 | 23 | 24 | 27 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 39 | 90;

type WpwLogColorMapping = [ WpwLogColorValue, WpwLogColorValue ];

type WpwLogIconString = `${string}`;
// type WpwLogIconString2 = `${string}${keyof WpwLoggerIconBaseSet}${string}`;

interface IWpwLoggerIconBaseSet
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
type WpwLoggerIconBaseSet = IWpwLoggerIconBaseSet;

type WpwLoggerIconBlueSet = Pick<WpwLoggerIconBaseSet, "error"|"info"|"success"|"warning">;

type WpwLoggerIconColorSet =
{
    errorTag: WpwLogIconString;
    infoTag: WpwLogIconString;
    starCyan: WpwLogIconString;
    successTag: WpwLogIconString;
    warningTag: WpwLogIconString;
} & WpwLoggerIconBaseSet;

type WpwLoggerIconSet =
{
    blue: WpwLoggerIconBlueSet;
    color: WpwLoggerIconColorSet;
} & WpwLoggerIconBaseSet;


export {
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
