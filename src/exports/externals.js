// @ts-check

/**
 * @file exports/extenals.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * NOTE: The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be
 * webpack'ed, -> @see {@link https://webpack.js.org/configuration/externals/}
 *
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("webpack").ExternalItemFunctionData} ExternalItemFunctionData */
/** @typedef {import("webpack").ExternalItemObjectKnown & import("webpack").ExternalItemObjectUnknown} NodeExternalsExternalItem */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @see {@link https://webpack.js.org/configuration/externals/}
 *
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const externals = (app) =>
{
	if (app.build.exports.externals || app.vscode)
	{
		if (app.isWeb) {
			app.wpc.externalsPresets = { web: true };
		}
		else {
			app.wpc.externalsPresets = { node: true };
		}
	}
	if (app.vscode)
	{
		if (app.build.name !== "tests")
		{
			// app.wpc.externals = [
			// 	(data, callback) => { logAsset(data, app); callback(undefined, { vscode: "commonjs vscode" }); },
			// 	(data, callback) => { logAsset(data, app); callback(undefined, !data.contextInfo?.issuerLayer ? nodeExternals() : undefined); }
			// ];
			app.wpc.externals = [
				{ vscode: "commonjs vscode" }
			];
		}
		else {
			app.wpc.externals = [
				{ vscode: "commonjs vscode" },
				// { nyc: "commonjs nyc" },
				/** @type {NodeExternalsExternalItem}*/(nodeExternals())
			];
		}
	}
	else if (app.build.exports.externals && app.build.name !== "tests" && app.build.name !== "types")
	{
		app.wpc.externals = /** @type {NodeExternalsExternalItem} */(nodeExternals());
	}
};


/**
 * @param {Readonly<ExternalItemFunctionData>} data
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const logAsset = (data, app) =>
{
	if (data && data.request)
	{
		app.logger.write(`set externals for asset italic(${data.request.substring(2)})`, 1);
		app.logger.value("   context", data.context, 1);
		app.logger.value("   dependencyType", data.dependencyType, 1);
		app.logger.value("   request", data.request, 1);
		if (data.contextInfo)
		{
			app.logger.value("   issuer", data.contextInfo.issuer, 1);
			app.logger.value("   issuer layer", data.contextInfo.issuerLayer, 1);
			// `compiler` value isin form `vscode-taskexplorer|undefined|extension|test|node|none`
			app.logger.value("   compiler / wpconfig exports.name", data.contextInfo.compiler, 1);
		}
	}
	return undefined;
};


module.exports = externals;
