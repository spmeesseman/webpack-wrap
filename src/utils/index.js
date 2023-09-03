// @ts-check

const WpwRegex = require("./regex");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("./console");
const { getSchema, getSchemaVersion, validateSchema, SchemaDirectory } = require("./schema");
const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const objUtils = require("./object");
const {
    apply, applyExt, applyIf,clone, merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot
} = require("./object");

const typeUtils = require("./type");
const {
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject, isObjectEmpty,
    isPrimitive, isPromise, isString
} = require("./type");

const utils = require("./utils");
const {
    asArray, capitalize, createEntryObjFromDir, execAsync, existsAsync, findExPath, findExPathSync, findFiles,
    findFilesSync, findFileUp,  WpwMessage, getExcludes, lowerCaseFirstChar, WpwMessageProps, isWpwMessageProp,
    pushIfNotExists, requireResolve, relativePath, resolvePath, uniq, WpBuildError
} = require("./utils");

module.exports = {
    apply, applyExt, applyIf, asArray, capitalize, clone, createEntryObjFromDir, execAsync, existsAsync, findExPath,
    findExPathSync, findFiles, findFilesSync, findFileUp, getExcludes, getSchema, isArray, isBoolean, isDirectory,
    isDate, isEmpty, isFunction, isJsTsConfigPath, isObject, typeUtils, isObjectEmpty, isPrimitive, isPromise, isString,
    isWpwMessageProp, lowerCaseFirstChar, merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, objUtils, pick,
    pickBy, pickNot, getSchemaVersion, pushIfNotExists, relativePath, resolvePath, requireResolve, SchemaDirectory,
    typedefs, uniq, utils, validateSchema, WpBuildConsoleLogger, WpBuildError, WpwMessage, WpwMessageProps, WpwRegex,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
