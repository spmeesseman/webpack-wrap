
// @ts-check

/**
 * @file src/core/basemodule.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBase = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { clone } = require("@spmeesseman/type-utils");
const { isWpwBuildOptionsKey } = require("../types/constants");
const { WpwAbstractFunctionError } = require("../utils/message");
const { lowerCaseFirstChar, relativePath, findFilesSync } = require("../utils/utils");


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
     * @type {typedefs.WpwBuildOptionsConfig<any>}
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
            this.buildOptions = clone(this.build.options[this.buildOptionsKey]);
        }
		this.virtualFile = `${this.build.name}${this.build.source.dotext}`;
		this.virtualFilePath = `${this.build.global.cacheDir}/${this.virtualFile}`;
        this.virtualFileRelPath = relativePath(this.build.getContextPath(), this.virtualFilePath);
    }


    get baseName() { return this.constructor.name.replace(/^Wpw|Plugin$|(?:Webpack)?Export$/g, ""); }
    get buildOptionsKey() { return /** @type {typedefs.WpwBuildOptionsKey} */(this.baseName.toLowerCase()); }
    get cacheName() { return `${this.build.name}_${this.build.mode}_${this.build.wpc.target}`.toLowerCase(); }


	/**
     * @abstract
     * @param {any[]} _args
	 * @returns {WpwBase | undefined | never}
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
            throw this.validationError("build");
        }
        const key = this.buildOptionsKey;
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
