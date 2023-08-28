// @ts-check

const WpBuildRc = require("../core/rc");
const WpBuildApp = require("../core/app");
const WpBuildCache = require("./cache");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyReadOnly, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyReadOnlys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const utils = require("./utils");
const {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, getExcludes,
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick,
    pickBy, pickNot, pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, getExcludes,
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick,
    pickBy, pickNot, pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath,
    WpBuildRc, RegexTestsChunk, utils, WpBuildConsoleLogger, WpBuildCache, WpBuildApp,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyReadOnly, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyReadOnlys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */
};
