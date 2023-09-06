/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const os = require("os");
const WpwSourceCode = require("./sourcecode");
const { mkdirSync, existsSync } = require("fs");
const { resolve, dirname, sep } = require("path");
const { validateSchema } = require("../utils/schema");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    apply, merge, mergeIf, resolvePath, asArray, WpwLogger, typedefs, applyIf, isEmpty, isObjectEmpty, isObject, isArray, WpBuildError, mergeWeak
} = require("../utils");

const defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;


/**
 * @implements {typedefs.IWpwBuild}
 * @implements {typedefs.IDisposable}
 */
class WpwBuild
{
    /** @type {string} */
    name;
    /** @type {boolean | undefined} */
    active;
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {boolean} */
    auto;
    /** @type {boolean} */
    debug;
    /** @type {typedefs.WpwWebpackEntry} */
    entry;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwRc}} @private */
    rc;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwBuildType} */
    type;
    /** @type {typedefs.WpwVsCode} */
    vscode;


    /**
     * @param {typedefs.IWpwBuild} config
     * @param {typedefs.WpwRc} rc
     * @param {WpwLogger} logger
     */
    constructor(config, rc, logger)
    {
        this.rc = rc;
        this.logger = logger;
        this.configure(config);
        const sourceConfig = merge({}, this.source);
        this.source = new WpwSourceCode(sourceConfig, this, this.logger);
    }

    dispose = () => this.source.dispose();


    /**
     * @private
     * @param {typedefs.WpwBuildModeConfigBase} rc
     * @returns {typedefs.WpwBuildModeConfigBase}
     */
    applyDefaultRc = (rc) =>
    {
        if (!rc.options) { rc.options = {}; }
        if (!rc.log) {
            rc.log = WpwLogger.defaultOptions();
        }
        else
        {   if (!rc.log.colors) {
                rc.log.colors = WpwLogger.defaultOptions().colors;
            }
            else if (!rc.log.colors.default) {
                rc.log.colors.default = WpwLogger.defaultOptions().colors.default;
            }
            if (!rc.log.pad) {
                rc.log.pad = WpwLogger.defaultOptions().pad;
            }
        }
        if (!rc.paths) {
            rc.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: defaultTempDir };
        }
        else
        {   if (!rc.paths.base) { rc.paths.base = "."; }
            if (!rc.paths.src) { rc.paths.src = "src"; }
            if (!rc.paths.dist) { rc.paths.dist = "dist"; }
            if (!rc.paths.ctx) { rc.paths.ctx = "."; }
            if (!rc.paths.temp) { rc.paths.temp = defaultTempDir; }
        }
        if (!rc.source)
        {
            rc.source = {
                type: "javascript", ext: "js",
                config: { options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: [] }
            };
        }
        else
        {
            if (!rc.source.type) {
                rc.source.type = "javascript";
                rc.source.type = "js";
            }
            else if (!rc.source.ext) {
                rc.source.ext = rc.source.type === "javascript" ? "js" : "ts";
            }
            if (!rc.source.config) {
                rc.source.config = {
                    options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: []
                };
            }
            else if (!rc.source.config.options) {
                rc.source.config.options = { compilerOptions: {}, files: [] };
            }
        }
        return rc;
    };


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs
     *
	 * @private
     * @param {typedefs.IWpwBuild} buildConfig
     * @throws {WpBuildError}
	 */
    configure = (buildConfig) =>
    {
        /**  @template D, S */
        const _applyProperty = (/** @type {string}  */property, /** @type {D}  */dst, /** @type {S}  */src) =>
        {
            if (src[property])
            {
                if (!dst[property]) {
                    dst[property] = merge({}, src[property]);
                }
                else {
                    mergeIf(dst[property], src[property]);
                }
            }
        };

        const _applyRc = (/** @type {typedefs.IWpwBuild}  */dst, /** @type {typedefs.WpwBuildModeConfigBase}  */src) =>
        {
            _applyProperty("paths", dst, src);
            _applyProperty("options", dst, src);
            _applyProperty("alias", dst, src);
            _applyProperty("source", dst, src);
            _applyProperty("vscode", dst, src);
            _applyProperty("log", dst, src);
            if (dst.log.color) {
                const clr = dst.log.color;
                applyIf(dst.log.colors, { valueStar: clr, buildBracket: clr, tagBracket: clr, infoIcon: clr });
            }
            apply(dst, { mode: dst.mode });
            return dst;
        };

        //
        // If enable isn't explicitly set to `false`, it's enabled, set non-existent enabled
        // properties as all options with !enabled will be removed upoon initialization completion
        //
        const config = merge({}, buildConfig);
        this.logger.write(`configure build '${config.name}'`, 1);
        // for (const [ option, buildOptions ] of Object.entries(config.options))
        // {
        //     if (!buildOptions || buildOptions.enabled === false || isObjectEmpty(buildOptions)) {
        //         delete config.options[option];
        //     }
        // }

        applyIf(config, {
            mode: config.mode || this.rc.mode, target: this.getTarget(config), type: this.getType(config)
        });

        this.logger.write("   apply base configuration", 2);
        _applyRc(config, this.applyDefaultRc(this.rc));

        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this.rc[this.rc.mode]);
        const modeBuildRc = asArray(modeRc?.builds).find(b => b.name === config.name);
        if (modeBuildRc) {
            this.logger.write("   apply mode configuration", 2);
            _applyRc(config, modeBuildRc);
        }

        this.logger.write("   resolve build paths", 2);
        this.applyDefaultRc(config);
        this.resolvePaths(config);

        this.logger.write("   validate build options", 2);
        Object.keys(config.options || {}).forEach((k) =>
        {
            if (config.options[k] === true) {
                config.options[k] = { enabled: true };
            }
            else if (config.options[k] === false) {
                delete config.options[k];
            }
            else if (isObject(config.options[k]))
            {
                if (config.options[k].enabled === false || config.options[k].enabled !== true)
                {
                    if (!buildConfig.options[k] || buildConfig.options[k].enabled === false) {
                        delete config.options[k];
                    }
                    else {
                        config.options[k].enabled = true;
                    }
                }
                else if (isObjectEmpty(config.options[k]) || isEmpty(config.options[k].enabled)) {
                    config.options[k].enabled = true;
                }
            }
            else {
                throw WpBuildError.get("invalid build options schema found");
            }
        });

        this.logger.write("   validate final build configuration", 2);
        validateSchema(config, this.logger, "build");

        merge(this, config);
        mergeWeak(buildConfig, config);

        this.logger.write(`final configuration for build '${config.name}' complete`, 2);
    };


    /**
     * @private
     * @param {typedefs.IWpwBuild} buildConfig
     */
    getTarget = (buildConfig) =>
    {
        let target = buildConfig.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.rc.args.target)) { target = this.rc.args.target; }
            else if ((/web(?:worker|app|view)/).test(buildConfig.name) || buildConfig.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(buildConfig.name)) { target = "web"; }
            else if ((/module|node/).test(buildConfig.name) || buildConfig.type === "module") { target = "node"; }
        }
        return target;
    };


    /**
     * @private
     * @param {typedefs.IWpwBuild} buildConfig
     */
    getType = (buildConfig) =>
    {
        let type = buildConfig.type;
        if (!type)
        {
            type = "module";
            if (isWpwBuildType(buildConfig.name)) { type = buildConfig.name; }
            else if ((/web(?:worker|app|view)/).test(buildConfig.name)) { type = "webapp"; }
            else if ((/tests?/).test(buildConfig.name)) { type = "tests"; }
            else if ((/typ(?:es|ings)/).test(buildConfig.name)) { type = "types"; }
            else if (buildConfig.target === "webworker") { type = "webapp"; }
        }
        return type;
    };


	/**
	 * @private
     * @param {typedefs.IWpwBuild} buildConfig
	 */
	resolvePaths = (buildConfig) =>
	{
        const paths = buildConfig.paths,
              base = dirname(this.rc.pkgJsonPath),
              // @ts-ignore
              ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
			  temp = resolve(
                  ostemp ? `${ostemp}${sep}${this.rc.pkgJson.scopedName.name}` : defaultTempDir,
                  `${buildConfig.target}${sep}${buildConfig.mode}`
              );
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        paths.base = base;
        paths.temp = paths.temp && paths.temp !== defaultTempDir ? paths.temp : temp;
        paths.ctx = paths.ctx ? resolvePath(base, paths.ctx) : base;
        paths.src = resolvePath(base, paths.src || "src");
        paths.dist = resolvePath(base, paths.dist || "dist");
	};

}


module.exports = WpwBuild;
