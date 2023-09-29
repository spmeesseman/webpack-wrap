/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join, resolve } = require("path");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const { apply, isFunction, WpwError, pushUniq, isArray, asArray, resolvePath} = require("../utils");
const { existsSync } = require("fs");


/**
 * @extends {WpwWebpackExport}
 */
class WpwResolveExport extends WpwWebpackExport
{
	/** @private */
	nodeModulesPath;


	/**
     * @param {typedefs.WpwExportOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		this.nodeModulesPath = resolve(__dirname, "../../node_modules");
	}


	/**
	 * @override
	 */
	app()
	{
		if (this.build.target === "web")
		{
			apply(this.build.wpc.resolve,
			{
				mainFields: [
					"web", "module", "main"
				],
				fallback: {
					path: require.resolve("path-browserify"),
					os: require.resolve("os-browserify/browser")
				}
			});
		}
		else
		{
			apply(this.build.wpc.resolve,
			{
				mainFields: [
					"module", "main"
				]
			});
		}
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build}); e.create(); return e; };


	/**
	 * @override
	 * @throws {WpwError}
	 */
	create()
	{
		const build= this.build;
		if (isFunction(this[build.type]))
		{
			build.logger.start("create resolve configuration", 2);
			build.logger.write(`   create rules for build '${build.name}' [ type: ${build.type} ]`, 2);
			this.base();
			this[build.type]();
			build.logger.success("   create resolve configuration", 2);
		}
		else {
			this.build.addMessage({ code: WpwError.Code.ERROR_SHITTY_PROGRAMMER, message: `exports.resolve.build[${build.type}]` });
		}
	}


	/**
	 * @private
	 */
	base()
	{
		apply(this.build.wpc,
		/** @type {Partial<typedefs.WpwWebpackConfig>} */({
			resolve:
			{
				alias: this.resolveAliasPaths(),
				modules: [
					this.nodeModulesPath, "node_modules"
				],
				extensions: []
			},
			resolveLoader:
			{
				alias: {
					"@babel": join(this.nodeModulesPath, "@babel") // ,
					// "@spmeesseman": join(this.nodeModulesPath, "@spmeesseman")
				},
				modules: [
					resolve(__dirname, "../loaders"),
					this.nodeModulesPath,
					"node_modules"
				]
			}
		}));

		const extensions = /** @type {string[]} */(this.build.wpc.resolve.extensions);
		if (this.build.source.type === "typescript")
		{
			extensions.unshift(".ts");
		}
		if (this.build.source.type === "javascript" || this.build.source.config.compilerOptions.allowJs)
		{
			extensions.unshift(".js");
		}
		if (this.build.source.config.compilerOptions.resolveJsonModule)
		{
			extensions.push(".json");
		}
		if (this.build.source.config.compilerOptions.jsx)
		{
			extensions.push(".jsx");
			if (this.build.source.type === "typescript") {
				extensions.unshift(".tsx");
			}
		}
	}


	/**
	 * @override
	 */
	jsdoc()
	{
		const config = this.build.options.jsdoc;
		if (config && config.enabled !== false)
		{
			pushUniq(/** @type {string[]} */(this.build.wpc.resolve.extensions), ".json");
		}
		else {
			this.build.addMessage({ code: WpwError.Code.WARNING_CONFIG_INVALID_EXPORTS, message: "exports.resolve.jsdoc" });
		}
	}


    /**
     * @private
	 * @returns {typedefs.WpwWebpackAliasConfig}
     */
    resolveAliasPaths()
    {
        /** @type {typedefs.WpwWebpackAliasConfig} */
        const alias = {},
              jstsConfig = this.build.source.config,
              jstsDir = this.build.source.configFile.dir,
              jstsPaths = jstsConfig.compilerOptions.paths;
        if (jstsDir && jstsPaths)
        {
            Object.entries(jstsPaths).filter(p => isArray(p)).forEach(([ key, p ]) =>
            {
            	p.forEach((p) => { alias[key] = pushUniq(asArray(alias[key]), resolvePath(jstsDir, p)); });
            });
        }
		return alias;
    }


	/**
	 * @override
	 */
	script()
	{
		const build = this.build,
			  config = build.options.script;
		if (config && config.enabled !== false)
		{

		}
	}


	/**
	 * @override
	 */
	tests()
	{
		const spmTestUtilsPath = join(this.build.getBasePath(), "node_modules", "@spmeesseman", "test-utils", "node_modules");
		if (existsSync(spmTestUtilsPath)) {
			this.build.wpc.resolve.modules?.push(spmTestUtilsPath);
		}
	}


	types()
	{
		const typesOptions = this.build.options.types;
		if (typesOptions && typesOptions.mode === "plugin")
		{
			pushUniq(/** @type {string[]} */(this.build.wpc.resolve.extensions), ".d.ts");
		}
		else {
			this.build.addMessage({ code: WpwError.Code.WARNING_CONFIG_INVALID_EXPORTS, message: "exports.resolve.types" });
		}
	}


	webapp()
	{
		apply(this.build.wpc.resolve,
		{
			modules: [
				this.build.getContextPath(),
				this.nodeModulesPath,
				resolve(__dirname, "../loaders"),
				"node_modules"
			]
		});
	}
};


module.exports = WpwResolveExport.create;
