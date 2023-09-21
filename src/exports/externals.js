// @ts-check

/**
 * @file src/exports/extenals.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * NOTE: The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be
 * webpack'ed, -> @see {@link https://webpack.js.org/configuration/externals/ webpack.js.org/externals}.
 *
 * Configurable in .wpwrc:
 *
 *    "build": {
 *       ...
 *       "overrides": {
 * 	        "externals": {
 *             "lodash": "lodash"
 *          }
 *       }
 *    }
 *
 *//** */

const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { isWebpackLibraryType } = require("../utils");
const nodeExternals = require("webpack-node-externals");
const { merge, apply, isObject, isObjectEmpty, isArray, isString, isEmpty } = require("@spmeesseman/type-utils");

/** @typedef {import("webpack").ExternalItemFunctionData} ExternalItemFunctionData */


/**
 * @param {typedefs.WpwBuild} build
 */
const externals = (build) =>
{
	const extCfg = build.options.externals,
		  externals = build.wpc.externals = /** @type {typedefs.WebpackExternalItem[]}*/([]);

	if (!isArray(externals)) {
		delete build.wpc.externals;
		return;
	}

	build.logger.start("create externals configuration", 2);

	if (extCfg && extCfg.enabled !== false && extCfg.presets)
	{
		if (build.target.startsWith("web")) {
			build.logger.write("   set externals preset to 'web'", 2);
			build.wpc.externalsPresets = { web: true };
		}
		else {
			build.logger.write("   set externals preset to 'node'", 2);
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
			build.logger.write("   add externals 'vscode'", 2);
			externals.push({ vscode: "commonjs vscode" });
		}
		else {
			build.logger.write("   add all externals 'vscode' & nodeExternals()", 2);
			externals.push(
				{ vscode: "commonjs vscode" },
				// { nyc: "commonjs nyc" },
				/** @type {typedefs.WebpackExternalItem}*/(nodeExternals())
			);
			build.logger.success("   create externals configuration", 2);
			return;
		}
	}

	if (extCfg && extCfg.enabled !== false)
	{
		if (isWebpackLibraryType(extCfg.type)) {
			build.wpc.externalsType = extCfg.type;
		}

		if (extCfg.all) // if (build.type !== "app" && build.type !== "webapp")
		{
			build.logger.write("   add externals 'all' & nodeExternals()", 2);
			externals.push(/** @type {typedefs.WebpackExternalItem}*/(nodeExternals()));
		}
		else
		{
			if (extCfg.defaults !== false)
			{
				build.logger.write("   add externals 'defaults'", 2);
				externals.push(
					/[\\\/\-]?webpack|typescript/
				);
			}

			if (extCfg.modules)
			{
				if (isArray(extCfg.modules, false) && isString(extCfg.modules[0]))
				{
					build.logger.write("   add externals 'modules'", 2);
					const external = /** @type {typedefs.WebpackExternalItem}*/({});
					extCfg.modules.forEach(m => { external[m] = (extCfg.type ? extCfg.type + " " : "") + m; });
					externals.push(external);
				}
				else
				{   build.addMessage({
						code: WpwError.Msg.ERROR_CONFIG_INVALID_EXPORTS,
						message: "invalid value for externals.modules, must be a string array"
					});
				}
			}

			if (extCfg.raw)
			{
				if (isObject(extCfg.raw))
				{
					externals.push(extCfg.raw);
					build.logger.write("   add externals 'raw'", 2);
				}
				else
				{   build.addMessage({
						code: WpwError.Msg.ERROR_CONFIG_INVALID_EXPORTS,
						message: "invalid value for externals.raw, must be an object"
					});
				}
			}
		}
	}

	if (isEmpty(build.wpc.externals)) {
		delete build.wpc.externals;
	}

	build.logger.success("   create externals configuration", 2);
};


/**
 * @param {Readonly<ExternalItemFunctionData>} data
 * @param {typedefs.WpwBuild} build
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
