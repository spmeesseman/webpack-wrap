
// @ts-check

/**
 * @file src/core/basemodule.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const { mkdirSync } = require("fs");
 const { join } = require("path");
 const WpwBase = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { relativePath, findFilesSync } = require("../utils");
const { isWpwBuildOptionsKey } = require("../types/constants");
const { WpwAbstractFunctionError } = require("../utils/message");
const { clone, isArray, isPrimitive, isObject } = require("@spmeesseman/type-utils");


/**
 * @abstract
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBaseModule}
 */
class WpwBaseModule extends WpwBase
{
    /**
     * @type {typedefs.WpwBuild}
     */
    build;
    /**
     * @protected
     * @type {typedefs.WpwBuildOptionsConfig<typedefs.WpwBuildOptionsKey>}
     */
    buildOptions;
    /**
     * @type {Record<string, any>}
     */
    globalCache;
    /**
     * @protected
     * @type {string}
     */
    globalBaseProperty;
    /**
     * @protected
     * @type {number}
     */
    hashDigestLength;
    /**
     * @private
     * @type {string[]}
     */
    pluginsNoOpts = [ "dispose", "sourcemaps" ];
	/**
	 * @protected
	 * @type {string}
	 */
	virtualBuildPath;
	/**
	 * @protected
	 * @type {string}
	 */
	virtualDirPath;
    /**
     * @protected
     * @type {string}
     */
	virtualFile;
	/**
     * @protected
     * @type {string}
     */
	virtualFilePath;
	/**
     * @protected
     * @type {string}
     */
	virtualFileRelPath;
    /**
     * @protected
     * @type {typedefs.WpwWebpackConfig}
     */
    wpc;


    /**
     * @param {typedefs.WpwBaseModuleOptions} options
     */
	constructor(options)
    {
        super(options);
        this.validateOptions(options);
        this.initGlobalCache();
        this.build = options.build;
        this.wpc = this.build.wpc;
        this.hashDigestLength = this.wpc.output.hashDigestLength || 20;
        if (options.buildOptions) {
            this.buildOptions = options.buildOptions;
        }
        else {
            this.buildOptions = clone(this.build.options[this.optionsKey]);
        }
		this.virtualFile = `${this.build.name}${this.build.source.dotext}`;
        this.virtualDirPath = join(this.build.global.cacheDir, this.build.name, `${this.build.target}-${this.build.mode}`);
        this.virtualBuildPath = join(this.virtualDirPath, "build");
		this.virtualFilePath = join(this.virtualDirPath, this.virtualFile);
        this.virtualFileRelPath = relativePath(this.build.getContextPath(), this.virtualFilePath);
        try { mkdirSync(this.virtualBuildPath, { recursive: true }); } catch{}
    }


    get optionsKey() { return this.constructor.name.replace(/^Wpw|Plugin$|(?:Webpack)?Export$/g, "").toLowerCase(); }
    get cacheName() { return `${this.build.name}_${this.build.mode}_${this.build.wpc.target}`.toLowerCase(); }

    static get optionsKey() { return this.name.replace(/^Wpw|Plugin$|(?:Webpack)?Export$/g, "").toLowerCase(); }


    /**
     * Break property name into separate spaced words at each camel cased character
     *
     * @protected
     * @param {string} prop
     * @returns {string} string
     */
    breakProp(prop) { return prop.replace(/_/g, "").replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                                 .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase(); }



	/**
     * @abstract
     * @param {any[]} _args
	 * @returns {typedefs.IWpwExport | typedefs.IWpwPlugin | undefined | never}
	 * @throws {typedefs.WpwError}
     */
	static create(..._args) { throw new WpwAbstractFunctionError(`[${this.name}[create][static]`); }


    /**
     * @protected
     * @param {string} dir
     * @param {typedefs.WpwSourceExtension | typedefs.WpwSourceDotExtensionApp} ext
     * @param {boolean | undefined} [recurse]
     * @param {string | string[] | undefined} [ignore]
     * @returns {typedefs.IWpwWebpackEntryImport}
     */
    createEntryObjFromDir(dir, ext, recurse, ignore)
    {
        const pattern = !recurse ? `*${ext}` : `**/*${ext}`;
        if (!ext.startsWith(".")) {
            ext = /** @type {typedefs.WpwSourceDotExtensionApp} */("." + ext);
        }
        return findFilesSync(
            pattern, {
                absolute: false, cwd: dir, dotRelative: false, posix: true, maxDepth: !recurse ? 1 : undefined, ignore
            }
        ).reduce((obj, e)=> {  obj[e.replace(ext, "")] = `./${e}`; return obj; }, {});
    };


	/**
	 * @protected
	 * @param {string} file
	 * @param {boolean} [rmvExt] Remove file extension
	 * @returns {string}
	 */
    fileNameStrip(file, rmvExt)
    {
        let newFile = file.replace(new RegExp(`\\.[a-f0-9]{${this.hashDigestLength},}`), "");
        if (rmvExt) {
            newFile = newFile.replace(/\.js(?:\.map)?/, "");
        }
        return newFile;
    }


    /**
     * @private
     */
    initGlobalCache()
    {
        const baseProp = this.globalBaseProperty = this.optionsKey;
        if (!this.global[baseProp]) {
            this.global[baseProp] = {};
        }
        this.globalCache = this.global[baseProp];
        this.options.globalCacheProps?.filter((/** @type {string} */p) => !this.globalCache[p]).forEach(
            (/** @type {string} */p) => { this.globalCache[p] = {}; }
        );
    }


    /**
     * @param {string | undefined} [key]
     * @param {boolean | undefined} [objects]
     * @param {boolean | undefined} [arrays]
     */
    logOptions(key, objects, arrays)
    {
        const logger = this.logger;
        const _logProperty = (/** @type {string} */ key, /** @type {any} */ value) =>
        {
            if (isPrimitive(value)) {
                if (key !== "enabled") {
                    logger.value(`   ${this.breakProp(key)}`, value, 1);
                }
            }
            else if (arrays !== false && isArray(value)) {
                logger.value(`   # of ${key}`, value.length, 1);
                // logger.write(`   ${key}:`, 2);
                // value.forEach((v) => logger.write(`   ${v}:`, 2));
                logger.value(`   ${this.breakProp(key)}`, value, 2);
            }
            else if (objects !== false && isObject(value)) {
                logger.value(`   ${this.breakProp(key)}`, value, 2);
            }
        };
        logger.write("build options:", 1);
        Object.entries(!key ? this.buildOptions : this.build.options[key]).forEach(([ key, value ]) => _logProperty(key, value));
    }


    /**
     * @abstract
     * @protected
     * @param {typedefs.WpwBuildOptionsConfig<typedefs.WpwBuildOptionsKey>} _config
     * @param {typedefs.WpwBuild} _build
     * @returns {boolean}
     */
	static validate(_config, _build) { return true; }


    /**
     * @private
     * @param {typedefs.WpwBaseModuleOptions} options
     * @throws {typedefs.WpwError}
     */
	validateOptions(options)
    {
        if (!options.build) {
            throw this.validationError("build");
        }
        const key = this.optionsKey;
        if (!key || (!this.pluginsNoOpts.includes(key) && !isWpwBuildOptionsKey(key)))
        {
            throw this.validationError("buildkey", `invalid option[key], '${key}' does not exist in build options`);
        }
    }


    /**
     * @protected
     * @param {string} property
     * @param {string} [detail]
     */
    validationError(property, detail)
    {
        return new WpwError({
            detail,
            wpc: this.wpc,
            capture: this.validateOptions,
            code: WpwError.Code.ERROR_RESOURCE_MISSING,
            message: `config validation failed for module ${this.name}: property ${property}`
        });
    }

}

module.exports = WpwBaseModule;
