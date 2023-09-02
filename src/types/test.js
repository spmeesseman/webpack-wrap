"use strict";
exports.__esModule = true;
exports.WpwMessage = exports.WpwMessageCodePrefix = void 0;
var WpwMessageCodePrefix;
(function (WpwMessageCodePrefix) {
    WpwMessageCodePrefix["Error"] = "WPW";
    WpwMessageCodePrefix["Info"] = "WPW";
    WpwMessageCodePrefix["Reserved"] = "WPW";
    WpwMessageCodePrefix["Warning"] = "WPW";
})(WpwMessageCodePrefix = exports.WpwMessageCodePrefix || (exports.WpwMessageCodePrefix = {}));
let WpwMessage;
((WpwMessage) => {
    WpwMessage["WPW650"] = "failed to modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled";
    WpwMessage["WPW899"] = "an unknown error has occurred";
    WpwMessage["WPW050"] = "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false";
})(WpwMessage = exports.WpwMessage || (exports.WpwMessage = {}));
