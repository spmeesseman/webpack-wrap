/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { stat, readFile } = require("fs");
const { join, resolve } = require("path");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const { apply, isFunction, WpwError} = require("../utils");


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
     * @param {typedefs.WpBuildApp} app
     */
	static build = (app) => { const e = new this({ app }); e.build(); return e; };


	/**
	 * @override
     * @protected
	 * @throws {WpwError}
	 */
	build = () =>
	{
		const app = this.app;
		if (isFunction(this[app.build.type]))
		{
			app.logger.start("create resolve configuration", 2);
			app.logger.write(`   create rules for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
			this.base();
			this[app.build.type]();
			app.logger.success("create resolve configuration", 2);
		}
		else {
			this.app.addError(WpwError.Msg.ERROR_SHITTY_PROGRAMMER, undefined, `exports.resolve.build[${app.build.type}]`);
		}
	};


	/**
	 * @private
	 */
	base()
	{
		apply(this.app.wpc,
		{
			resolve:
			{
				alias: this.app.build.alias,
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
					"@babel": join(this.nodeModulesPath, "@babel")
				},
				modules: [
					resolve(__dirname, "../loaders"),
					this.nodeModulesPath,
					"node_modules"
				]
			}
		});
	}


	jsdoc()
	{
		const jsdocOptions = this.app.build.options.jsdoc;
		if (jsdocOptions && jsdocOptions.enabled)
		{
			//
		}
		else {
			this.app.addWarning(WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS, undefined, "exports.resolve.jsdoc");
		}
	}


	module()
	{
		if (this.app.build.target === "web")
		{
			apply(this.app.wpc.resolve,
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
			apply(this.app.wpc.resolve,
			{
				mainFields: [
					"module", "main"
				]
			});
		}
	}


	tests()
	{
		const testsOptions = this.app.build.options.testsuite;
		if (testsOptions && testsOptions.enabled)
		{
			//
		}
		else {
			this.app.addWarning(WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS, undefined, "exports.resolve.tests");
		}
	}


	types()
	{
		const typesOptions = this.app.build.options.types;
		if (typesOptions && typesOptions.enabled && typesOptions.mode === "module")
		{
			apply(this.app.wpc.resolve,
			{
				// fileSystem: {
				// 	readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
				// 	readlink: (arg0, arg1) => arg1(undefined, ""),
				// 	// @ts-ignore
				// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
				// 	// @ts-ignore
				// 	stat: (arg1, arg2) => stat(arg1, () => arg2(undefined, { isFile: () => true }))
				// }
				// resolver: {
				// 	fileSystem: {
				// 		readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
				// 		readlink: (arg0, arg1) => arg1(undefined, ""),
				// 		// @ts-ignore
				// 		readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
				// 		stat: (arg1, arg2) => stat(arg1, arg2)
				// 	}
				// },
				// resolveLoader: {
				// 	// ,
				// 	// fileSystem: {
				// 	// 	readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
				// 	// 	readlink: (arg0, arg1) => arg1(undefined, ""),
				// 	// 	// @ts-ignore
				// 	// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
				// 	// 	// @ts-ignore
				// 	// 	stat: (arg1, arg2) => stat(arg1, () => arg2(undefined, { isFile: () => true }))
				// 	// }
				// }
			});
		}
		else {
			this.app.addWarning(WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS, undefined, "exports.resolve.types");
		}
	}


	webapp()
	{
		apply(this.app.wpc.resolve,
		{
			modules: [
				this.app.getContextPath(), "node_modules"
			]
		});
	}
};


module.exports = WpwResolveExport.build;
