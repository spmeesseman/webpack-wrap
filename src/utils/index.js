// @ts-check

const typedefs = require("../types/typedefs");
const { RegexTestsChunk } = require("./regex");
const WpBuildConsoleLogger = require("./console");
const { getSchema, validateSchema, SchemaDirectory } = require("./schema");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const objUtils = require("./object");
const {
    apply, applyIf,clone, merge, mergeIf, pick, pickBy, pickNot
} = require("./object");

const typeUtils = require("./type");
const {
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject, isObjectEmpty,
    isPrimitive, isPromise, isString
} = require("./type");

const utils = require("./utils");
const {
    asArray, capitalize, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,  WpwMessage, getExcludes,
    lowerCaseFirstChar, WpwMessageProps, isWpwMessageProp, pushIfNotExists, requireResolve, uniq, WpBuildError,
    relativePath, resolvePath, createEntryObjFromDir, findExPath, findExPathSync
} = require("./utils");

module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject, typeUtils,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick, pickBy, pickNot, objUtils,
    pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath, RegexTestsChunk, typedefs, getSchema, validateSchema, SchemaDirectory,
    utils, WpBuildConsoleLogger, createEntryObjFromDir, findExPath, findExPathSync, WpwMessage, WpwMessageProps, isWpwMessageProp,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
