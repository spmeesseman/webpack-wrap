// @ts-check

const WpwRegex = require("./regex");
const typedefs = require("../types/typedefs");
const WpwLogger = require("./console");

const { WpwMessage, WpwMessageEnum, WpBuildError } = require("./message");

const {
    getSchema, getDefinitionSchema, getDefinitionSchemaProperties, getSchemaVersion, SchemaDirectory,
    validateBuildOptions, validateSchema
} = require("./schema");

const {/* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigTypesBundler, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptBuildMethod, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigTypesBundlers, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptBuildMethodEnum, WpwSourceCodeTypescriptBuildMethods, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */} = require("../types/constants");

const objUtils = require("@spmeesseman/type-utils").objUtils;
const {
    apply, applyExt, applyIf,clone, merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot
} = require("@spmeesseman/type-utils");

const typeUtils = require("@spmeesseman/type-utils").typeUtils;
const {
    isArray, isBoolean, isDirectory, isDate, isEmpty, isError, isFunction, isJsTsConfigPath, isObject, isObjectEmpty,
    isPrimitive, isPromise, isString
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
    isDirectory, isDate, isEmpty, isError, isFunction, isJsTsConfigPath, isObject, typeUtils, isObjectEmpty,
    isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeExt, mergeExt2, mergeIf,
    mergeWeak, mergeIfWeak, objUtils, pick, pickBy, pickNot, getDefinitionSchema, getDefinitionSchemaProperties,
    getSchemaVersion, pushIfNotExists, relativePath,resolvePath, requireResolve, SchemaDirectory, validateBuildOptions,
    typedefs, uniq, utils, validateSchema, WpwLogger, WpBuildError, WpwMessage, WpwMessageEnum, WpwRegex,
    /* START_RC_DEFS */ isWebpackLibraryType, isWebpackMode, isWebpackTarget, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKey, isWpwBuildOptionsPluginKeyInternal, isWpwBuildType, isWpwLogColor, isWpwLogTrueColor, isWpwPackageJsonProp, isWpwPluginConfigRunScriptsProp, isWpwPluginConfigTypesBundler, isWpwPluginConfigWaitEvent, isWpwRcPathsProp, isWpwSourceCodeExtension, isWpwSourceCodeNodeJsModule, isWpwSourceCodeNodeJsModuleResolution, isWpwSourceCodeNodeJsTarget, isWpwSourceCodeType, isWpwSourceCodeTypescriptBuildMethod, isWpwSourceCodeTypescriptLoader, isWpwWebhookCompilationHookStage, isWpwWebpackCompilationHook, isWpwWebpackCompilerHook, isWpwWebpackMode, WebpackLibraryTypes, WebpackModes, WebpackTargets, WpwBuildOptionsExportKeyInternals, WpwBuildOptionsExportKeys, WpwBuildOptionsPluginKeyInternals, WpwBuildOptionsPluginKeys, WpwBuildTypes, WpwLogColors, WpwLogTrueColors, WpwPackageJsonProps, WpwPluginConfigRunScriptsProps, WpwPluginConfigTypesBundlers, WpwPluginConfigWaitEvents, WpwRcPathsProps, WpwSourceCodeExtensions, WpwSourceCodeNodeJsModuleResolutions, WpwSourceCodeNodeJsModules, WpwSourceCodeNodeJsTargets, WpwSourceCodeTypes, WpwSourceCodeTypescriptBuildMethodEnum, WpwSourceCodeTypescriptBuildMethods, WpwSourceCodeTypescriptLoaders, WpwWebhookCompilationHookStages, WpwWebpackCompilationHooks, WpwWebpackCompilerHooks, WpwWebpackModes /* END_RC_DEFS */
};
