/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { merge } = require("../utils");
const typedefs = require("../types/typedefs");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * @file exports/minification.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */


/**
 * @function
 * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const minification = (build) =>
{   //
	// NOTE:  Webpack 5 performs minification built-in now for production builds.
	// Most likely, set build.exports.minification=false
	//
	if (build.options.minification && build.wpc.mode === "production")
	{
		build.wpc.optimization = merge(build.wpc.optimization || {},
		{
			minimize: true,
			minimizer: [
				new TerserPlugin(
				build.cmdLine.esbuild ?
				{
					minify: TerserPlugin.esbuildMinify,
					terserOptions: {
						// @ts-ignore
						drop: [ "debugger" ],
						// compress: true,
						// mangle: true,   // Default `false`
						format: { ecma: 2020, comments: false },
						minify: true,
						sourceMap: false,
						treeShaking: true,
						// Keep the class names otherwise @log won"t provide a useful name
						keepNames: true,
						// keep_names: true,
						target: "es2020"
					}
				} :
				{
					extractComments: false,
					parallel: true,
					terserOptions: {
						compress: {
							drop_debugger: true
						},
						// compress: true,
						// mangle: true,   // Default `false`
						ecma: 2020,
						sourceMap: false,
						format: {},
						// format: {       // Default {}
						// 	comments: false, // default "some"
						// 	shebang: true
						// },
						// toplevel (default false) - set to true to enable top level variable
						// and function name mangling and to drop unused variables and functions.
						// toplevel: false,
						// nameCache: null,
						// Keep the class names otherwise @log won"t provide a useful name
						keep_classnames: true,
						module: true
					}
				})
			]
		});
	}
};


module.exports = minification;
