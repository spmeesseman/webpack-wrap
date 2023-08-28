// @ts-check

const WpBuildRc = require("../core/rc");
const WpBuildApp = require("../core/app");
const WpBuildCache = require("./cache");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyReadOnly, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyReadOnlys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const utils = require("./utils");
const {
    apply, applyIf, asArray, capitalize, clone, execAsync, merge, mergeIf, isArray, isJsTsConfigPath, requireResolve,
    isDate, isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, pushIfNotExists,
    pick, pickBy, pickNot, findFiles,findFilesSync, uniq, WpBuildError, getExcludes, relativePath, resolvePath, isDirectory
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, WpBuildApp, findFiles, findFilesSync, getExcludes,
    isArray, isDate, isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, requireResolve,
    lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot, uniq, WpBuildCache, WpBuildConsoleLogger, isDirectory,
    WpBuildError, WpBuildRc, RegexTestsChunk, relativePath, resolvePath, utils, isJsTsConfigPath, pushIfNotExists,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyReadOnly, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyReadOnlys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */
};
