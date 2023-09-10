// @ts-check

const WpwRegex = require("./regex");
const typedefs = require("../types/typedefs");
const WpwLogger = require("./console");

const WpwError = require("./message");

const {
    getSchema, getDefinitionSchema, getDefinitionSchemaProperties, getSchemaVersion, SchemaDirectory,
    validateBuildOptions, validateSchema
} = require("./schema");

const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigTypesBundler, isWpwRcPathsKey, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptBuildMethod, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigRunScriptsKeys, WpwPluginConfigTypesBundlers, WpwRcPathsKeys, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptBuildMethodEnum, WpwSourceCodeTypescriptBuildMethods, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const objUtils = require("@spmeesseman/type-utils").objUtils;
const typeUtils = require("@spmeesseman/type-utils").typeUtils;
const {
    apply, applyExt, applyIf, clone, isArray, isBoolean, isDirectory, isDate, isEmpty, isError, isFunction,
    isJsTsConfigPath, isNulled, isNumber, isNumeric, isObject, isObjectEmpty, isPrimitive, isPromise, isString,
    merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot
} = require("@spmeesseman/type-utils");

const utils = require("./utils");
const {
    asArray, capitalize, createEntryObjFromDir, execAsync, existsAsync, findExPath, findExPathSync, findFiles,
    findFilesSync, findFileUp, getExcludes, lowerCaseFirstChar, pushIfNotExists, requireResolve, relativePath,
    resolvePath, uniq
} = require("./utils");

module.exports = {
    apply, applyExt, applyIf, asArray, capitalize, clone, createEntryObjFromDir, execAsync, existsAsync,
    findExPath, findExPathSync, findFiles, findFilesSync, findFileUp, getExcludes, getSchema, isArray, isBoolean,
    isDirectory, isDate, isEmpty, isError, isFunction, isJsTsConfigPath, isNulled, isNumber, isNumeric,isObject,
    typeUtils, isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeExt, mergeExt2,
    mergeIf, mergeWeak, mergeIfWeak, objUtils, pick, pickBy, pickNot, getDefinitionSchema, getDefinitionSchemaProperties,
    getSchemaVersion, pushIfNotExists, relativePath,resolvePath, requireResolve, SchemaDirectory, validateBuildOptions,
    typedefs, uniq, utils, validateSchema, WpwLogger, WpwError, WpwRegex,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildBaseConfigKey, isWpwBuildOptionsKey, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonKey, isWpwPluginConfigRunScriptsKey, isWpwPluginConfigTypesBundler, isWpwRcPathsKey, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptBuildMethod, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildBaseConfigKeys, WpwBuildOptionsKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonKeys, WpwPluginConfigRunScriptsKeys, WpwPluginConfigTypesBundlers, WpwRcPathsKeys, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptBuildMethodEnum, WpwSourceCodeTypescriptBuildMethods, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
