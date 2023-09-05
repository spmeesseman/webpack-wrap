/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file exports/plugins.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpBuildApp = require("../core/app");
// const wpwPlugins = require("../plugins");
const { createEntryObjFromDir /* , asArray, isFunction, isObject  */} = require("../utils");
const {
	analyze, banner, clean, copy, dispose, environment, istanbul, loghooks, ignore, optimization,
	progress, runtimevars, sourcemaps, licensefiles, tscheck, upload, wait, cssextract, htmlcsp,
	imageminimizer, htmlinlinechunks, testsuite, tsbundle, types, vendormod, webviewapps, scm
} = require("../plugins");

/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const plugins = (app) =>
{
	app.logger.start("create plugins configuration", 2);
	// Object.keys(wpwPlugins).forEach((p) =>
	// {
	// 	if (isFunction(wpwPlugins[p])) {
	// 		app.wpc.plugins.push(...asArray(wpwPlugins[p](app)));
	// 	}
	// 	else if (isObject(wpwPlugins[p]))
	// 	{
	// 		Object.keys(wpwPlugins[p]).forEach((p) =>
	// 		{
	// 			if (isFunction(wpwPlugins[p])) {
	// 				app.wpc.plugins.push(...asArray(wpwPlugins[p](app)));
	// 			}
	// 		});
	// 	}
	// });
	app.wpc.plugins.push(
		loghooks(app),           // n/a - logs all compiler.hooks.* when they run
		environment(app),        // compiler.hooks.environment
		vendormod(app),          // compiler.hooks.afterEnvironment - mods to vendor plugins and/or modules
		progress(app),           // n/a - reports progress from webpack engine
		clean(app),              // compiler.hooks.emit, compiler.hooks.done
		types(app),              // compiler.hooks.beforeCompile - build tests / test suite
		testsuite(app),          // compiler.hooks.beforeCompile - build tests / test suite
		banner(app),             // compiler.hooks.compilation -> compilation.hooks.processAssets
		istanbul(app),           // compiler.hooks.compilation - add istanbul ignores to node-requires
		runtimevars(app),        // compiler.hooks.compilation
		ignore(app),             // compiler.hooks.normalModuleFactory
		tscheck(app),            // compiler.hooks.afterEnvironment, hooks.afterCompile
		...webPlugins(app),      // webapp specific plugins
		...nodePlugins(app),     // webapp specific plugins
		...sourcemaps(app),      // compiler.hooks.compilation -> compilation.hooks.processAssets
		...optimization(app),    // compiler.hooks.shouldEmit, compiler.hooks.compilation->shouldRecord|optimizeChunks
		analyze.analyzer(app),   // compiler.hooks.done
		analyze.visualizer(app), // compiler.hooks.emit
		analyze.circular(app),   // compiler.hooks.compilation -> compilation.hooks.optimizeModules
		licensefiles(app),       // compiler.hooks.shutdown
		upload(app),             // compiler.hooks.afterDone
		scm(app),                // compiler.hooks.shutdown
		dispose(app)             // perform cleanup, dispose registred disposables
	);

	app.wpc.plugins.slice().reverse().forEach((p, i, a) => { if (!p) { app.wpc.plugins.splice(a.length - 1 - i, 1); }});
	app.logger.write("   plugins configuration created successfully", 2);
};


/**
 * @param {WpBuildApp} app Webpack build specific environment
 * @returns {(WebpackPluginInstance | undefined)[]}
 */
const nodePlugins = (app) =>
{
	/** @type {(WebpackPluginInstance | undefined)[]} */
	const plugins = [];
	if (app.build.type !== "webapp")
	{
		plugins.push(
			tsbundle(app),      // compiler.hooks.afterEnvironment, hooks.afterCompile
			copy(app)           // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
		);
	}
	return plugins;
};


/**
 * @param {WpBuildApp} app Webpack build specific environment
 * @returns {(WebpackPluginInstance | undefined)[]}
 */
const webPlugins = (app) =>
{
	/** @type {(WebpackPluginInstance | undefined)[]} */
	const plugins = [];
	if (app.build.type === "webapp")
	{
		const apps = Object.keys(app.build.entry || createEntryObjFromDir(app.getSrcPath(), ".ts"));
		plugins.push(
			cssextract(app),           //
			...webviewapps(apps, app), //
			// @ts-ignore
			htmlcsp(app),              //
			htmlinlinechunks(app),     //
			copy(app),                 // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			imageminimizer(app)        //
		);
	}
	return plugins;
};


module.exports = plugins;
