/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file exports/plugins.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwBuild = require("../core/build");
// const wpwPlugins = require("../plugins");
const { createEntryObjFromDir /* , asArray, isFunction, isObject  */} = require("../utils");
const {
	analyze, banner, clean, copy, dispose, environment, istanbul, loghooks, ignore, optimization,
	progress, runtimevars, sourcemaps, licensefiles, tscheck, upload, cssextract, htmlcsp,
	imageminimizer, htmlinlinechunks, testsuite, types, vendormod, webviewapps, scm
} = require("../plugins");

/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const plugins = (build) =>
{
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
		loghooks(build),           // n/a - logs all compiler.hooks.* when they run
		environment(build),        // compiler.hooks.environment
		vendormod(build),          // compiler.hooks.afterEnvironment - mods to vendor plugins and/or modules
		progress(build),           // n/a - reports progress from webpack engine
		clean(build),              // compiler.hooks.emit, compiler.hooks.done
		types(build),              // compiler.hooks.beforeCompile - build tests / test suite
		testsuite(build),          // compiler.hooks.beforeCompile - build tests / test suite
		banner(build),             // compiler.hooks.compilation -> compilation.hooks.processAssets
		istanbul(build),           // compiler.hooks.compilation - add istanbul ignores to node-requires
		runtimevars(build),        // compiler.hooks.compilation
		ignore(build),             // compiler.hooks.normalModuleFactory
		tscheck(build),            // compiler.hooks.afterEnvironment, hooks.afterCompile
		...webPlugins(build),      // webapp specific plugins
		...nodePlugins(build),     // webapp specific plugins
		sourcemaps(build),         // compiler.hooks.compilation -> compilation.hooks.processAssets
		...optimization(build),    // compiler.hooks.shouldEmit, compiler.hooks.compilation->shouldRecord|optimizeChunks
		analyze.analyzer(build),   // compiler.hooks.done
		analyze.visualizer(build), // compiler.hooks.emit
		analyze.circular(build),   // compiler.hooks.compilation -> compilation.hooks.optimizeModules
		licensefiles(build),       // compiler.hooks.shutdown
		upload(build),             // compiler.hooks.afterDone
		scm(build),                // compiler.hooks.shutdown
		dispose(build)             // perform cleanup, dispose registred disposables
	);

	build.wpc.plugins.slice().reverse().forEach((p, i, a) => { if (!p) { build.wpc.plugins.splice(a.length - 1 - i, 1); }});
	build.logger.write("   plugins configuration created successfully", 2);
};


/**
 * @param {WpwBuild} build Webpack build specific environment
 * @returns {(WebpackPluginInstance | undefined)[]}
 */
const nodePlugins = (build) =>
{
	/** @type {(WebpackPluginInstance | undefined)[]} */
	const plugins = [];
	if (build.type !== "webapp")
	{
		plugins.push(
			copy(build)           // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
		);
	}
	return plugins;
};


/**
 * @param {WpwBuild} build Webpack build specific environment
 * @returns {(WebpackPluginInstance | undefined)[]}
 */
const webPlugins = (build) =>
{
	/** @type {(WebpackPluginInstance | undefined)[]} */
	const plugins = [];
	if (build.type === "webapp")
	{
		const apps = Object.keys(build.entry || createEntryObjFromDir(build.getSrcPath(), ".ts"));
		plugins.push(
			cssextract(build),           //
			...webviewapps(apps, build), //
			// @ts-ignore
			htmlcsp(build),              //
			htmlinlinechunks(build),     //
			copy(build),                 // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			imageminimizer(build)        //
		);
	}
	return plugins;
};


module.exports = plugins;
