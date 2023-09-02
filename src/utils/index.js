// @ts-check

const typedefs = require("../types/typedefs");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const utils = require("./utils");
const {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject, WpwMessage,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot, WpwMessageProps, isWpwMessageProp,
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, createEntryObjFromDir, findExPath, findExPathSync
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot,
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, RegexTestsChunk, typedefs,
    utils, WpBuildConsoleLogger, createEntryObjFromDir, findExPath, findExPathSync, WpwMessage, WpwMessageProps, isWpwMessageProp,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
