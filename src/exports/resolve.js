/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { apply } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const resolve = (app) =>
{
	apply(app.wpc.resolve,
	{
		alias: app.build.alias,
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
	});


	if (app.build.type !== "webapp")
	{
		apply(app.wpc.resolve,
		{
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined
		});
	}
	else {
		apply(app.wpc.resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}
};


module.exports = resolve;
