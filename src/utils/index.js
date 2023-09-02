// @ts-check

const WpwRc = require("../core/rc");
const WpBuildCache = require("./cache");
const WpBuildApp = require("../core/app");
const WpwPlugin = require("../plugins/base");
const typedefs = require("../types/typedefs");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwMessageProp, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwMessage, WpwMessageProps, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

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
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, WpwRc, RegexTestsChunk, typedefs,
    utils, WpBuildConsoleLogger, WpBuildCache, WpBuildApp, WpwPlugin, createEntryObjFromDir, findExPath, findExPathSync,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsPluginKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwMessageProp, isWpwPackageJsonProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwMessage, WpwMessageProps, WpwPackageJsonProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
