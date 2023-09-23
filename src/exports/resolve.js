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
     * @protected
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
				extensions: [
					".ts", ".tsx", ".js", ".jsx", ".json"
				]
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
	}


	jsdoc()
	{
		const jsdocOptions = this.build.options.jsdoc;
		if (!jsdocOptions || jsdocOptions.enabled === false) {
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
    };


	tests()
	{
		const testsOptions = this.build.options.testsuite;
		if (testsOptions && testsOptions.enabled)
		{
			//
		}
		else {
			this.build.addMessage({ code: WpwError.Code.WARNING_CONFIG_INVALID_EXPORTS, message: "exports.resolve.tests" });
		}
	}


	types()
	{
		const typesOptions = this.build.options.types;
		if (typesOptions && typesOptions.mode === "plugin" && this.build.wpc.resolve.extensions)
		{
			this.build.wpc.resolve.extensions.push(".d.ts");
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
				this.build.getContextPath(), "node_modules"
			]
		});
	}
};


module.exports = WpwResolveExport.create;
