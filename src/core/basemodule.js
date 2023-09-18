
// @ts-check

/**
 * @file src/core/basemodule.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBase = require("./base");
const typedefs = require("../types/typedefs");
const { lowerCaseFirstChar, WpwError, clone } = require("../utils");
const { isWpwBuildOptionsKey } = require("../types/constants");


/**
 * @abstract
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBaseModule}
 */
class WpwBaseModule extends WpwBase
{
    /** @type {typedefs.WpwBuild} */
    build;
    /** @type {typedefs.WpwBuildOptionsConfig<any>} @protected */
    buildOptions;
    /** @type {Record<string, any>} */
    globalCache;
    /** @type {string}  @protected */
    globalBaseProperty;
    /** @protected */
    hashDigestLength;
    /** @private */
    pluginsNoOpts = [ "dispose" ];
    /** @protected */
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
        this.buildOptions = clone(this.build.options[this.buildOptionsKey]);
        this.build.disposables.push(this);
    }


    get baseName() { return this.constructor.name.replace(/^Wpw|Plugin$|(?:Webpack)?Export$/g, ""); }
    get buildOptionsKey() { return /** @type {typedefs.WpwBuildOptionsKey} */(this.baseName.toLowerCase()); }


	/**
     * @abstract
     * @param {any[]} _args
	 * @returns {WpwBase | undefined | never}
	 * @throws {typedefs.WpwError}
     */
	static create(..._args) { throw WpwError.getAbstractFunction(`[${this.name}[create][static]`); }


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
        const baseProp = this.globalBaseProperty = lowerCaseFirstChar(this.baseName);
        if (!this.global[baseProp]) {
            this.global[baseProp] = {};
        }
        this.globalCache = this.global[baseProp];
        this.options.globalCacheProps?.filter((/** @type {string} */p) => !this.global[p]).forEach(
            (/** @type {string} */p) => { this.global[p] = {}; }
        );
    }

    /**
     * @private
     * @param {typedefs.WpwBaseModuleOptions} options Plugin options to be applied
     * @throws {typedefs.WpwError}
     */
	validateOptions(options)
    {
        if (!options.build) {
            throw WpwError.getErrorMissing("app", this.wpc, "invalid option[app]");
        }
        const key = this.buildOptionsKey;
        if (!key || (!this.pluginsNoOpts.includes(key) && !isWpwBuildOptionsKey(key))) {
            throw WpwError.getErrorProperty("key", this.wpc, `invalid option[key], '${key}' does not exist in build options`);
        }
    }

}

module.exports = WpwBaseModule;
