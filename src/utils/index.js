// @ts-check

const WpwRegex = require("./regex");
const WpwError = require("./message");
const WpwLogger = require("./console");
const dtsBundle = require("./dtsbundle");
const { applySchemaDefaults, getSchemaVersion, validateSchema } = require("./schema");
const { printBuildProperties, printBuildStart, printNonFatalIssue, printWpcProperties } = require("./print");

const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigTypesBuildMode, isWpwPluginConfigTypesBundler, isWpwPluginConfigTypesMethod, isWpwRcPathsKey, isWpwSchemaKey, isWpwSourceExtension, isWpwSourceJavascriptLoader, isWpwSourceNodeJsModule, isWpwSourceNodeJsModuleResolution, isWpwSourceNodeJsTarget, isWpwSourceType, isWpwSourceTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwKeysEnum, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigRunScriptsKeys, WpwPluginConfigTypesBuildModes, WpwPluginConfigTypesBundlers, WpwPluginConfigTypesMethods, WpwRcPathsKeys, WpwSchemaKeys, WpwSourceExtensions, WpwSourceJavascriptLoaders, WpwSourceNodeJsModuleResolutions, WpwSourceNodeJsModules, WpwSourceNodeJsTargets, WpwSourceTypes, WpwSourceTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes, requiredProperties /* END_RC_DEFS */} = require("../types/constants");

const {
    apply, applyExt, applyIf, clone, isArray, isBoolean, isClass, isDirectory, isDate, isEmpty, isError,
    isFunction, isNulled, isNumber, isNumeric, isObject, isObjectEmpty, isPrimitive, isPromise, isString,
    merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot, objUtils, typeUtils
} = require("@spmeesseman/type-utils");

const utils = require("./utils");
const {
    asArray, capitalize, createEntryObjFromDir, execAsync, existsAsync, findExPath, findExPathSync, findFiles,
    findFilesSync, findFileUp, getExcludes, lowerCaseFirstChar, pushIfNotExists, requireResolve, relativePath,
    resolvePath, uniq
} = require("./utils");

module.exports = {
    apply, applyExt, applyIf, applySchemaDefaults, asArray, capitalize, clone, createEntryObjFromDir, dtsBundle, execAsync, existsAsync,
    findExPath, findExPathSync, findFiles, findFilesSync, findFileUp, getExcludes, getSchemaVersion, isArray, isBoolean, isClass,
    isDirectory, isDate, isEmpty, isError, isFunction, isNulled, isNumber, isNumeric, isObject, typeUtils,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeExt, mergeExt2, mergeIf, mergeWeak,
    mergeIfWeak, objUtils, pick, pickBy, pickNot, printBuildProperties, printBuildStart, printNonFatalIssue, printWpcProperties,
    pushIfNotExists, relativePath, resolvePath, requireResolve, uniq, utils, validateSchema, WpwLogger, WpwError, WpwRegex,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigTypesBuildMode, isWpwPluginConfigTypesBundler, isWpwPluginConfigTypesMethod, isWpwRcPathsKey, isWpwSchemaKey, isWpwSourceExtension, isWpwSourceJavascriptLoader, isWpwSourceNodeJsModule, isWpwSourceNodeJsModuleResolution, isWpwSourceNodeJsTarget, isWpwSourceType, isWpwSourceTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwKeysEnum, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigRunScriptsKeys, WpwPluginConfigTypesBuildModes, WpwPluginConfigTypesBundlers, WpwPluginConfigTypesMethods, WpwRcPathsKeys, WpwSchemaKeys, WpwSourceExtensions, WpwSourceJavascriptLoaders, WpwSourceNodeJsModuleResolutions, WpwSourceNodeJsModules, WpwSourceNodeJsTargets, WpwSourceTypes, WpwSourceTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes, requiredProperties /* END_RC_DEFS */
};
