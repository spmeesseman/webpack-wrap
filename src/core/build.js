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
const { mkdirSync, existsSync } = require("fs");
const { resolve, dirname, sep } = require("path");
const { validateSchema } = require("../utils/schema");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    apply, merge, mergeIf, resolvePath, asArray, isObjectEmpty, WpwLogger, typedefs, applyIf, isEmpty
} = require("../utils");


/**
 * @implements {typedefs.IWpwBuild}
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
    /** @type {string} @private */
    defaultTempDir;
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
        this.defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;
        this.configure(config);
    }


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs
     *
	 * @private
     * @param {typedefs.IWpwBuild} config
	 */
    configure = (config) =>
    {
        const _log = (/** @type {typedefs.IWpwBuild}  */build, /** @type {string}  */msg) => {
            this.logger.write(`   ${msg} build ${this.logger.withColor(build.name, this.logger.colors.italic)}`, 2);
        };

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
            apply(dst, { mode: dst.mode || this.mode, target: this.getTarget(dst), type: this.getType(dst) });
            return dst;
        };

        //
        // Merge the base rc config into the build
        //
        this.logger.write("configure defined builds", 1);
        //
        // If enable isn't explicitly set to `false`, it's enabled, set non-existent enabled
        // properties as all options with !enabled will be removed upoon initialization completion
        //
        Object.keys(this.options || {}).forEach((k) =>
        {
            if (isEmpty(this.options[k].enabled)) {
                this.options[k].enabled = true;
            }
        });
        _log(this, "apply base configuration to");
        this.initializeBaseRc(this.rc);
        _applyRc(config, this.rc);

        //
        // Merge any environment matching rc configs into each build
        //
        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this.rc[this.rc.mode]);
        const modeBuildRc = asArray(modeRc?.builds).find(b => b.name === this.name);
        if (modeBuildRc) {
            _log(this, "apply mode configuration to");
            _applyRc(config, modeBuildRc);
        }

        //
        // Resolve configured build paths and Validate
        //
        _log(this, "validate and initialize configuration for ");
        this.initializeBaseRc(config);
        this.resolvePaths();
        for (const [ option, buildOptions ] of Object.entries(this.options))
        {
            if (!buildOptions || buildOptions.enabled === false || isObjectEmpty(buildOptions)) {
                delete config.options[option];
            }
        }

        validateSchema(config, this.logger, "build");

        // const buildRc = asArray(this.rc.buildConfigs).find(b => b.name === this.name);
        // if (buildRc) {
        //     _log(this, "apply mode configuration to");
        //     _applyRc(buildRc, this);
        // }
        // else {
        //     this.rc.buildConfigs.push(this);
        // }
        merge(this, config);

        this.logger.write("build configuration complete", 2);
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
     * @param {typedefs.WpwBuildModeConfigBase} rc
     */
    initializeBaseRc = (rc) =>
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
            rc.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: this.defaultTempDir };
        }
        else
        {   if (!rc.paths.base) { rc.paths.base = "."; }
            if (!rc.paths.src) { rc.paths.src = "src"; }
            if (!rc.paths.dist) { rc.paths.dist = "dist"; }
            if (!rc.paths.ctx) { rc.paths.ctx = "."; }
            if (!rc.paths.temp) { rc.paths.temp = this.defaultTempDir; }
        }
        if (!rc.source)
        {
            rc.source = {
                type: "javascript", ext: "ts",
                config: { options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: [] }
            };
        }
        else
        {   if (!rc.source.type) {
                rc.source.type = "javascript";
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
    };


	/**
	 * @private
	 */
	resolvePaths = () =>
	{
        const paths = this.paths,
              base = dirname(this.rc.pkgJsonPath),
              // @ts-ignore
              ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
			  temp = resolve(ostemp ? `${ostemp}${sep}${this.rc.pkgJson.scopedName.name}` : this.defaultTempDir, this.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        paths.base = base;
        paths.temp = paths.temp && paths.temp !== this.defaultTempDir ? paths.temp : temp;
        paths.ctx = paths.ctx ? resolvePath(base, paths.ctx) : base;
        paths.src = resolvePath(base, paths.src || "src");
        paths.dist = resolvePath(base, paths.dist || "dist");
	};

}


module.exports = WpwBuild;
