// @ts-check

const WpBuildRc = require("../core/rc");
const WpBuildApp = require("../core/app");
const WpBuildCache = require("./cache");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebhookCompilationHookStage, isWebpackCompilationHook, isWebpackCompilerHook, isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebhookCompilationHookStages, WebpackCompilationHooks, WebpackCompilerHooks, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const utils = require("./utils");
const {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot,
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, createEntryObjFromDir, findExPath, findExPathSync
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot,
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, WpBuildRc, RegexTestsChunk,
    utils, WpBuildConsoleLogger, WpBuildCache, WpBuildApp, createEntryObjFromDir, findExPath, findExPathSync,
    /* START_RC_DEFS */ isWebhookCompilationHookStage, isWebpackCompilationHook, isWebpackCompilerHook, isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebpackMode, WebhookCompilationHookStages, WebpackCompilationHooks, WebpackCompilerHooks, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonEnum, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsEnum, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebpackModes /* END_RC_DEFS */
};
