/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const { apply } = require("../utils");
const WpBuildApp = require("../core/app");
const { stat, readFile } = require("fs");
const resolvePath = require("path").resolve;


/**
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const resolve = (app) =>
{
	const wpw_node_modules = resolvePath(__dirname, "../../node_modules");
	apply(app.wpc,
	{
		resolve: {
			alias: app.build.alias,
			modules: [ wpw_node_modules, "node_modules" ],
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
		},
		resolveLoader: {
			modules: [ resolvePath(__dirname, "../loaders"), wpw_node_modules, "node_modules" ],
			alias: {
				"@babel": join(wpw_node_modules, "@babel")
			} // ,
			// fileSystem: {
			// 	readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
			// 	readlink: (arg0, arg1) => arg1(undefined, ""),
			// 	// @ts-ignore
			// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
			// 	// @ts-ignore
			// 	stat: (arg1, arg2) => stat(arg1, () => arg2(undefined, { isFile: () => true }))
			// }
		 }
	});


	if (app.build.type !== "webapp")
	{
		apply(app.wpc.resolve,
		{
			modules: [ wpw_node_modules, "node_modules" ],
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined // ,
			// fileSystem: {
			// 	readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
			// 	readlink: (arg0, arg1) => arg1(undefined, ""),
			// 	// @ts-ignore
			// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
			// 	// @ts-ignore
			// 	stat: (arg1, arg2) => stat(arg1, () => arg2(undefined, { isFile: () => true }))
			// } // ,
			// resolver: {
			// 	fileSystem: {
			// 		readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
			// 		readlink: (arg0, arg1) => arg1(undefined, ""),
			// 		// @ts-ignore
			// 		readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
			// 		stat: (arg1, arg2) => stat(arg1, arg2)
			// 	}
			// }
		});
	}
	else {
		apply(app.wpc.resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}
};


module.exports = resolve;
