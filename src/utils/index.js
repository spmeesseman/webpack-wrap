// @ts-check

const WpBuildRc = require("../core/rc");
const WpBuildApp = require("../core/app");
const WpBuildCache = require("./cache");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpBuildLogColor, isWpBuildLogTrueColor, isWpBuildRcPackageJsonProp, isWpBuildRcPathsProp, isWpBuildWebpackMode, isWpwBuildType, isWpwRcSourceCodeNodeJsModule, isWpwRcSourceCodeNodeJsModuleResolution, isWpwRcSourceCodeNodeJsTarget, isWpwRcSourceCodeType, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpBuildLogColors, WpBuildLogTrueColors, WpBuildRcPackageJsonProps, WpBuildRcPathsEnum, WpBuildRcPathsProps, WpBuildWebpackModes, WpwBuildTypes, WpwRcSourceCodeNodeJsModuleResolutions, WpwRcSourceCodeNodeJsModules, WpwRcSourceCodeNodeJsTargets, WpwRcSourceCodeTypes /* END_RC_DEFS */} = require("../types/constants");

const utils = require("./utils");
const {
    apply, applyIf, asArray, capitalize, clone, execAsync, merge, mergeIf, isArray, isJsTsConfigPath, requireResolve,
    isDate, isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar,
    pick, pickBy, pickNot, findFiles,findFilesSync, uniq, WpBuildError, getExcludes, relativePath, resolvePath
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, WpBuildApp, findFiles, findFilesSync, getExcludes,
    isArray, isDate, isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, requireResolve,
    lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot, uniq, WpBuildCache, WpBuildConsoleLogger,
    WpBuildError, WpBuildRc, RegexTestsChunk, relativePath, resolvePath, utils, isJsTsConfigPath,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpBuildLogColor, isWpBuildLogTrueColor, isWpBuildRcPackageJsonProp, isWpBuildRcPathsProp, isWpBuildWebpackMode, isWpwBuildType, isWpwRcSourceCodeNodeJsModule, isWpwRcSourceCodeNodeJsModuleResolution, isWpwRcSourceCodeNodeJsTarget, isWpwRcSourceCodeType, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpBuildLogColors, WpBuildLogTrueColors, WpBuildRcPackageJsonProps, WpBuildRcPathsEnum, WpBuildRcPathsProps, WpBuildWebpackModes, WpwBuildTypes, WpwRcSourceCodeNodeJsModuleResolutions, WpwRcSourceCodeNodeJsModules, WpwRcSourceCodeNodeJsTargets, WpwRcSourceCodeTypes /* END_RC_DEFS */
};
