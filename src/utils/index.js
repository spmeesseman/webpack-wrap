// @ts-check

const WpwRegex = require("./regex");
const WpwError = require("./message");
const WpwLogger = require("./console");
const dtsBundle = require("./dtsbundle");
const { applySchemaDefaults, getSchemaVersion, validateSchema } = require("./schema");
const { printBuildProperties, printBuildStart, printWpcProperties } = require("./print");

const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwExportConfigCacheMode, isWpwExportConfigDevToolMapType, isWpwExportConfigDevToolType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigJsDocMode, isWpwPluginConfigJsDocTemplate, isWpwPluginConfigJsDocTheme, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigRunScriptsMode, isWpwPluginConfigTypesBuildMode, isWpwPluginConfigTypesBundler, isWpwPluginConfigTypesMethod, isWpwRcPathsKey, isWpwSchemaKey, isWpwSourceExtension, isWpwSourceJavascriptLoader, isWpwSourceNodeJsModule, isWpwSourceNodeJsModuleResolution, isWpwSourceNodeJsTarget, isWpwSourceType, isWpwSourceTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwExportConfigCacheModes, WpwExportConfigDevToolMapTypes, WpwExportConfigDevToolTypes, WpwKeysEnum, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigJsDocModes, WpwPluginConfigJsDocTemplates, WpwPluginConfigJsDocThemes, WpwPluginConfigRunScriptsKeys, WpwPluginConfigRunScriptsModes, WpwPluginConfigTypesBuildModes, WpwPluginConfigTypesBundlers, WpwPluginConfigTypesMethods, WpwRcPathsKeys, WpwSchemaKeys, WpwSourceExtensions, WpwSourceJavascriptLoaders, WpwSourceNodeJsModuleResolutions, WpwSourceNodeJsModules, WpwSourceNodeJsTargets, WpwSourceTypes, WpwSourceTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes, requiredProperties /* END_RC_DEFS */} = require("../types/constants");

const {
    apply, applyExt, applyIf, arrUtils, asArray, clone, isArray, isBoolean, isClass, isDirectory, isDate, isEmpty,
    isError, isFunction, isNulled, isNumber, isNumeric, isObject, isObjectEmpty, isPrimitive, isPromise, isString,
    merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot, objUtils, pushReturn,
    pushUniq, typeUtils, uniq
} = require("@spmeesseman/type-utils");

const utils = require("./utils");
const {
    capitalize, execAsync, existsAsync, findExPath, findExPathSync, findFiles, findFilesSync,
    findFileUp, forwardSlash, getExcludes, lowerCaseFirstChar, requireResolve, relativePath, resolvePath
} = require("./utils");

module.exports = {
    apply, applyExt, applyIf, applySchemaDefaults, arrUtils, asArray, capitalize, clone, dtsBundle,
    execAsync, existsAsync, findExPath, findExPathSync, findFiles, findFilesSync, findFileUp, forwardSlash, getExcludes,
    getSchemaVersion, isArray, isBoolean, isClass, isDirectory, isDate, isEmpty, isError, isFunction, isNulled, isNumber,
    isNumeric, isObject, typeUtils, isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeExt,
    mergeExt2, mergeIf, mergeWeak, mergeIfWeak, objUtils, pick, pickBy, pickNot, printBuildProperties, printBuildStart,
    printWpcProperties, pushReturn, pushUniq, relativePath, resolvePath, requireResolve, uniq, utils, validateSchema,
    WpwLogger, WpwError, WpwRegex,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwExportConfigCacheMode, isWpwExportConfigDevToolMapType, isWpwExportConfigDevToolType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigJsDocMode, isWpwPluginConfigJsDocTemplate, isWpwPluginConfigJsDocTheme, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigRunScriptsMode, isWpwPluginConfigTypesBuildMode, isWpwPluginConfigTypesBundler, isWpwPluginConfigTypesMethod, isWpwRcPathsKey, isWpwSchemaKey, isWpwSourceExtension, isWpwSourceJavascriptLoader, isWpwSourceNodeJsModule, isWpwSourceNodeJsModuleResolution, isWpwSourceNodeJsTarget, isWpwSourceType, isWpwSourceTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwExportConfigCacheModes, WpwExportConfigDevToolMapTypes, WpwExportConfigDevToolTypes, WpwKeysEnum, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigJsDocModes, WpwPluginConfigJsDocTemplates, WpwPluginConfigJsDocThemes, WpwPluginConfigRunScriptsKeys, WpwPluginConfigRunScriptsModes, WpwPluginConfigTypesBuildModes, WpwPluginConfigTypesBundlers, WpwPluginConfigTypesMethods, WpwRcPathsKeys, WpwSchemaKeys, WpwSourceExtensions, WpwSourceJavascriptLoaders, WpwSourceNodeJsModuleResolutions, WpwSourceNodeJsModules, WpwSourceNodeJsTargets, WpwSourceTypes, WpwSourceTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes, requiredProperties /* END_RC_DEFS */
};
