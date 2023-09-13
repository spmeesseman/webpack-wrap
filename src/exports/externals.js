// @ts-check

/**
 * @file exports/extenals.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * NOTE: The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be
 * webpack'ed, -> @see {@link https://webpack.js.org/configuration/externals/ webpack.js.org/externals}
 *
 *//** */

const WpwBuild = require("../core/build");
const nodeExternals = require("webpack-node-externals");

/** @typedef {import("../types").WebpackExternalItem} WebpackExternalItem */
/** @typedef {import("webpack").ExternalItemFunctionData} ExternalItemFunctionData */


/**
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const externals = (build) =>
{
	if (build.options.externals || build.vscode)
	{
		if (build.target.startsWith("web")) {
			build.wpc.externalsPresets = { web: true };
		}
		else {
			build.wpc.externalsPresets = { node: true };
		}
	}
	if (build.vscode)
	{
		if (build.type === "app" || build.type === "webapp")
		{
			// build.wpc.externals = [
			// 	(data, callback) => { logAsset(data, app); callback(undefined, { vscode: "commonjs vscode" }); },
			// 	(data, callback) => { logAsset(data, app); callback(undefined, !data.contextInfo?.issuerLayer ? nodeExternals() : undefined); }
			// ];
			build.wpc.externals = [
				{ vscode: "commonjs vscode" }
			];
		}
		else {
			build.wpc.externals = [
				{ vscode: "commonjs vscode" },
				// { nyc: "commonjs nyc" },
				/** @type {WebpackExternalItem}*/(nodeExternals())
			];
		}
	}
	else if (build.options.externals && build.name !== "app" && build.name !== "webapp")
	{
		build.wpc.externals = /** @type {WebpackExternalItem} */(nodeExternals());
	}
};


/**
 * @param {Readonly<ExternalItemFunctionData>} data
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const logAsset = (data, build) =>
{
	if (data && data.request)
	{
		build.logger.write(`set externals for asset italic(${data.request.substring(2)})`, 1);
		build.logger.value("   context", data.context, 1);
		build.logger.value("   dependencyType", data.dependencyType, 1);
		build.logger.value("   request", data.request, 1);
		if (data.contextInfo)
		{
			build.logger.value("   issuer", data.contextInfo.issuer, 1);
			build.logger.value("   issuer layer", data.contextInfo.issuerLayer, 1);
			// `compiler` value isin form `vscode-taskexplorer|undefined|extension|test|node|none`
			build.logger.value("   compiler / wpconfig exports.name", data.contextInfo.compiler, 1);
		}
	}
};


module.exports = externals;
