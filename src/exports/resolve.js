/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const { apply } = require("../utils");
const resolvePath = require("path").resolve;


/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


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
			modules: [ wpw_node_modules, "node_modules" ],
			alias: {
				"@babel": join(wpw_node_modules, "@babel")
			}
		 }
	});


	if (app.build.type !== "webapp")
	{
		apply(app.wpc.resolve,
		{
			modules: [ wpw_node_modules, "node_modules" ],
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined
		});
	}
	else {
		apply(app.wpc.resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}
};


module.exports = resolve;
