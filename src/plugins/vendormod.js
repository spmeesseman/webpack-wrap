/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/vendormod.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { basename, join, resolve } = require("path");
const { existsSync, readFileSync, readdirSync, writeFileSync } = require("fs");


/**
 * @extends WpwPlugin
 */
class WpBuildVendorModPlugin extends WpwPlugin
{
	static ranOnce = false;

    /** @type {Exclude<typedefs.WpwBuildOptions["vendormod"], undefined>} @override */
    buildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		this.onApply(compiler,
        {
            modifyVendorPlugins: {
                hook: "afterEnvironment",
                callback: this.modifyVendorSource.bind(this)
            }
        });
    }


	/**
	 * @private
	 */
	modifyVendorSource = () =>
	{
		if (!WpBuildVendorModPlugin.ranOnce && this.buildOptions.enabled)
		{
			if (this.buildOptions.clean_plugin) {
				this.cleanPlugin();
			}
			if (this.buildOptions.source_map_plugin) {
				this.sourceMapPlugin();
			}
			if (this.buildOptions.ts_loader) {
				this.tsLoader();
			}
		}
		WpBuildVendorModPlugin.ranOnce = true;
	};


	/**
	 * @private
	 */
	cleanPlugin = () =>
	{   //
		// Make a lil change to the copy-plugin to initialize the current assets array to
		// the existing contents of the dist directory.  By default it's current assets list
		// is empty, and thus will not work across IDE restarts
		//
		const cleanPlugin = join(this.app.getRcPath("base"), "node_modules", "clean-webpack-plugin", "dist", "clean-webpack-plugin.js");
		if (existsSync(cleanPlugin))
		{
			const distPath = this.app.getDistPath();
			let content = readFileSync(cleanPlugin, "utf8").replace(/currentAssets = \[ "[\w"\., _\-]*" \]/, "currentAssets = []");
			if (existsSync(distPath))
			{
				const distFiles = `"${readdirSync(distPath).map(f => basename(f)).join("\", \"")}"`;
				content = content.replace("currentAssets = []", `currentAssets = [ ${distFiles} ]`);
			}
			writeFileSync(cleanPlugin, content);
		}
	};


	/**
	 * @private
	 */
	sourceMapPlugin = () =>
	{
		// if (!(compilation instanceof Compilation)) {
		// 	throw new TypeError(
		// 		"The 'compilation' argument must be an instance of Compilation"
		// 	);
		// }
		//
		// WEBPACK.SOURCEMAPPLUGIN
		// file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\javascript\JavascriptModulesPlugin.js
		//
		// A hck to remove a check added in Webpack 5 using 'instanceof' to check the compilation parameter.
		// If multiple webpack installs are present, the follwoing error occurs, regardlkess if Wp versions are the same:
		//
		// TypeError: The 'compilation' argument must be an instance of Compilation
    	//    at Function.getCompilationHooks (C:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\javascript\JavascriptModulesPlugin.js:164:10)
    	//    at SourceMapDevToolModuleOptionsPlugin.apply (C:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\SourceMapDevToolModuleOptionsPlugin.js:54:27)
    	//    at C:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\SourceMapDevToolPlugin.js:184:53
    	//    at Hook.eval [as call] (eval at create (C:\Projects\vscode-taskexplorer\node_modules\tapable\lib\HookCodeFactory.js:19:10), <anonymous>:106:1)
    	//    at Hook.CALL_DELEGATE [as _call] (C:\Projects\vscode-taskexplorer\node_modules\tapable\lib\Hook.js:14:14)
		//	  ....
		//
		// Seeing it's a module resolution issue, this was patched for this plugin using 'require.resolve'
		// in the cwd when importing this plugin in plugins/sourcemaps.js.
		//
		// This is a "in the worst case" fix, where we can "kind if" safley remove this check, and
		// consider it patched if redundant testing yields no side effects,
		//
		const sourceMapPlugin = resolve(
			this.app.getRcPath("base"), "..", "@spmeesseman", "webpack-wrap", "node_modules", "webpack", "lib", "javascript", "JavascriptModulesPlugin.js"
		);
		if (existsSync(sourceMapPlugin))
		{
			const content = readFileSync(sourceMapPlugin, "utf8").replace(
				/if \(\!\(compilation instanceof Compilation\)\)/,
				"if (false)"
			);
			writeFileSync(sourceMapPlugin, content);
		}
	};


	/**
	 * @private
	 */
	tsLoader = () =>
	{   //
		// TS-LOADER
		// file:///c:\Projects\vscode-taskexplorer\node_modules\ts-loader\dist\index.js
		//
		// A hck to allow just a straight up types 'declarations only' build.
		//
		const tsLoader = join(this.app.getRcPath("base"), "node_modules", "ts-loader", "dist", "index.js");
		if (existsSync(tsLoader))
		{
			let content = readFileSync(tsLoader, "utf8").replace(
				/if \(outputText === null \|\| outputText === undefined\)/,
				"if ((outputText === null || outputText === undefined) && (!instance.loaderOptions.compilerOptions || !instance.loaderOptions.compilerOptions.emitDeclarationsOnly))"
			);
			content = content.replace("callback(null, output, sourceMap);", "callback(null, (!instance.loaderOptions.compilerOptions || !instance.loaderOptions.compilerOptions.emitDeclarationsOnly ? output : \"\"), sourceMap);");
			writeFileSync(tsLoader, content);
		}
	};

}


/**
 * Returns a `WpBuildVendorModPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpcrc.json by setting the `plugins.vendormod`
 * property to a boolean value of  `true` or `false`
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildVendorModPlugin | undefined}
 */
const vendormod = (app) => WpwPlugin.getBuildOptions("vendormod", app).enabled ? new WpBuildVendorModPlugin({ app }) : undefined;


module.exports = vendormod;
