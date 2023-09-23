/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/exports/plugins.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { isString} = require("../utils");
// const wpwPlugins = require("../plugins");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const {
	analyze, banner, clean, copy, dispose, environment, istanbul, loghooks, ignore, jsdoc,
	optimization, progress, runtimevars, sourcemaps, licensefiles, tscheck, upload, cssextract,
	htmlcsp, imageminimizer, htmlinlinechunks, testsuite, types, vendormod, webviewapps, scm
} = require("../plugins");


/**
 * @extends {WpwWebpackExport}
 */
class WpwPluginsExport extends WpwWebpackExport
{
	/**
     * @param {typedefs.WpwExportOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build }); e.create(); return e; };


	/**
	 */
	create = () =>
	{
		const build = this.build;
		build.logger.start("create plugins configuration", 2);
		// Object.keys(wpwPlugins).forEach((p) =>
		// {
		// 	if (isFunction(wpwPlugins[p])) {
		// 		build.wpc.plugins.push(...asArray(wpwPlugins[p](build)));
		// 	}
		// 	else if (isObject(wpwPlugins[p]))
		// 	{
		// 		Object.keys(wpwPlugins[p]).forEach((p) =>
		// 		{
		// 			if (isFunction(wpwPlugins[p])) {
		// 				build.wpc.plugins.push(...asArray(wpwPlugins[p](build)));
		// 			}
		// 		});
		// 	}
		// });
		build.wpc.plugins.push(
			loghooks(build),            // n/a - logs all compiler.hooks.* when they run
			environment(build),         // compiler.hooks.environment
			vendormod(build),           // compiler.hooks.afterEnvironment - mods to vendor plugins and/or modules
			progress(build),            // n/a - reports progress from webpack engine
			clean(build),               // compiler.hooks.emit, compiler.hooks.done
			jsdoc(build),               // compiler.hooks.compilation - compilation.hooks.processAssets|ADDITIONAL
			types(build),               // compiler.hooks.compilation - compilation.hooks.processAssets|ADDITIONAL
			testsuite(build),           // compiler.hooks.beforeCompile - build tests / test suite
			banner(build),              // compiler.hooks.compilation -> compilation.hooks.processAssets
			istanbul(build),            // compiler.hooks.compilation - add istanbul ignores to node-requires
			runtimevars(build),         // compiler.hooks.compilation - compilation.hooks.processAssets|ADDITIONS
			ignore(build),              // compiler.hooks.normalModuleFactory
			tscheck(build),             // compiler.hooks.afterEnvironment, hooks.afterCompile
			...this.webPlugins(build),  // webapp specific plugins
			...this.nodePlugins(build), // webapp specific plugins
			sourcemaps(build),          // compiler.hooks.compilation -> compilation.hooks.processAssets|DEV_TOOLING
			...optimization(build),     // compiler.hooks.shouldEmit, compiler.hooks.compilation->shouldRecord|optimizeChunks
			analyze.analyzer(build),    // compiler.hooks.done
			analyze.visualizer(build),  // compiler.hooks.emit
			analyze.circular(build),    // compiler.hooks.compilation -> compilation.hooks.optimizeModules
			licensefiles(build),        // compiler.hooks.compilation -> compilation.hooks.processAssets|ANALYSE
			upload(build),              // compiler.hooks.afterDone
			scm(build),                 // compiler.hooks.done
			dispose(build)              // compiler.hooks.shutdown
		);

		build.wpc.plugins.slice().reverse().forEach((p, i, a) => { if (!p) { build.wpc.plugins.splice(a.length - 1 - i, 1); }});
		build.logger.write("   plugins configuration created successfully", 2);
	};


	/**
	 * @private
	 * @param {typedefs.WpwBuild} build Webpack build specific environment
	 * @returns {(typedefs.WebpackPluginInstance | undefined)[]}
	 */
	nodePlugins = (build) =>
	{
		/** @type {(typedefs.WebpackPluginInstance | undefined)[]} */
		const plugins = [];
		if (build.type !== "webapp")
		{
			plugins.push(
				copy(build)           // compiler.hooks.thisCompilation -> compilation.hooks.processAssets|ADDITIONAL
			);
		}
		return plugins;
	};


	/**
	 * @private
	 * @param {typedefs.WpwBuild} build Webpack build specific environment
	 * @returns {(typedefs.WebpackPluginInstance | undefined)[]}
	 */
	webPlugins = (build) =>
	{
		/** @type {(typedefs.WebpackPluginInstance | undefined)[]} */
		const plugins = [];
		if (build.type === "webapp")
		{
			const apps = isString(build.entry) ? [ build.entry ] :
						(Object.keys(build.entry || this.createEntryObjFromDir(build.getSrcPath(), ".ts")));
			plugins.push(
				cssextract(build),           //
				...webviewapps(apps, build), //
				// @ts-ignore
				htmlcsp(build),              //
				htmlinlinechunks(build),     //
				copy(build, { apps }),       // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
				imageminimizer(build)        //
			);
		}
		return plugins;
	};

};


module.exports = WpwPluginsExport.create;

