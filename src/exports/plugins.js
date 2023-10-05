/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/exports/plugins.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

// const wpwPlugins = require("../plugins");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const plugins = require("../plugins");


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
			plugins.loghooks(build),           // n/a - logs all compiler.hooks.* when they run
			plugins.wait(build),               // compiler.hooks.beforeRun
			plugins.environment(build),        // compiler.hooks.environment
			plugins.vendormod(build),          // compiler.hooks.afterEnvironment
			plugins.progress(build),           // n/a - reports progress from webpack engine
			plugins.clean(build),              // compiler.hooks.emit, compiler.hooks.done
			plugins.hash(build),               // compiler.hooks.afterEmit, compiler.hooks.compilation -> compilation.hooks.processAssets|PRE_PROCESS
			plugins.jsdoc(build),              // compiler.hooks.compilation -> compilation.hooks.processAssets|ADDITIONAL
			plugins.script(build),             // compiler.hooks.compilation -> compilation.hooks.processAssets|ADDITIONAL
			plugins.types(build),              // compiler.hooks.compilation -> compilation.hooks.processAssets|ADDITIONAL
			plugins.testsuite(build),          // compiler.hooks.beforeCompile
			plugins.banner(build),             // compiler.hooks.compilation -> compilation.hooks.processAssets
			plugins.istanbul(build),           // compiler.hooks.compilation -> add istanbul ignores to node-requires
			plugins.runtimevars(build),        // compiler.hooks.compilation -> compilation.hooks.processAssets|ADDITIONS
			plugins.ignore(build),             // compiler.hooks.normalModuleFactory
			plugins.tscheck(build),            // compiler.hooks.afterEnvironment, hooks.afterCompile
			plugins.web(build),                // webapp specific plugins
			plugins.copy(build),			   // compiler.hooks.thisCompilation -> compilation.hooks.processAssets|ADDITIONAL
			plugins.sourcemaps(build),         // compiler.hooks.compilation -> compilation.hooks.processAssets|DEV_TOOLING
			...plugins.optimization(build),    // compiler.hooks.shouldEmit, compiler.hooks.compilation -> shouldRecord|optimizeChunks
			plugins.analyze.analyzer(build),   // compiler.hooks.done
			plugins.analyze.visualizer(build), // compiler.hooks.emit
			plugins.analyze.circular(build),   // compiler.hooks.compilation -> compilation.hooks.optimizeModules
			plugins.licensefiles(build),       // compiler.hooks.compilation -> compilation.hooks.processAssets|ANALYSE
			plugins.upload(build),             // compiler.hooks.afterDone
			plugins.scm(build),                // compiler.hooks.done
			plugins.dispose(build)             // compiler.hooks.shutdown
		);

		build.wpc.plugins.slice().reverse().forEach((p, i, a) => { if (!p) { build.wpc.plugins.splice(a.length - 1 - i, 1); }});
		build.logger.write("   plugins configuration created successfully", 2);
	};

};


module.exports = WpwPluginsExport.create;

