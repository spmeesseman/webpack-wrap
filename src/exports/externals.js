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
const { isObject, isArray, isString, isEmpty } = require("@spmeesseman/type-utils");


/**
 * @param {typedefs.WpwBuild} build
 */
const externals = (build) =>
{
	const extCfg = build.options.externals,
	      extEnabled = extCfg && extCfg.enabled !== false,
		  externals = /** @type {typedefs.WebpackExternalItem[]}*/(build.wpc.externals);

	build.logger.start("create externals configuration", 2);

	if (build.vscode && (build.type === "app" || build.type === "webapp"))
	{
		build.logger.write("   add externals module 'vscode'", 2);
		externals.push({ vscode: "commonjs vscode" });
	}

	if (extEnabled)
	{
		if (extCfg.presets !== false)
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

		if (isWebpackLibraryType(extCfg.type))
		{
			build.logger.write("   set externals modules type to " + extCfg.type, 2);
			build.wpc.externalsType = extCfg.type;
		}

		if (extCfg.all) // if (build.type !== "app" && build.type !== "webapp")
		{
			build.logger.write("   add externals modules 'all' & nodeExternals()", 2);
			externals.push(/** @type {typedefs.WebpackExternalItem}*/(nodeExternals()));
		}
		else
		{
			if (extCfg.defaults !== false)
			{
				build.logger.write("   add externals modules 'defaults'", 2);
				externals.push(
					/[\\\/\-]?webpack|typescript/
				);
			}

			if (extCfg.modules)
			{
				if (isArray(extCfg.modules, false) && isString(extCfg.modules[0]))
				{
					build.logger.write("   add externals modulea 'modules'", 2);
					const external = /** @type {typedefs.WebpackExternalItem}*/({});
					extCfg.modules.forEach(m => { external[m] = (extCfg.type ? extCfg.type + " " : "") + m; });
					externals.push(external);
				}
				else
				{   build.addMessage({
						code: WpwError.Code.ERROR_CONFIG_INVALID_EXPORTS,
						message: "invalid value for externals.modules, must be a string array"
					});
				}
			}

			if (extCfg.raw)
			{
				if (isObject(extCfg.raw))
				{
					externals.push(extCfg.raw);
					build.logger.write("   add externals modules 'raw'", 2);
				}
				else
				{   build.addMessage({
						code: WpwError.Code.ERROR_CONFIG_INVALID_EXPORTS,
						message: "invalid value for externals.raw, must be an object"
					});
				}
			}
		}

		if (build.logger.level >= 5)
		{
			externals.push((data, cb) => { logAsset(data, build); cb(undefined, undefined); });
		}
	}

	if (isEmpty(build.wpc.externals)) {
		delete build.wpc.externals;
	}

	build.logger.success("   create externals configuration", 2);
};


/**
 * @param {Readonly<typedefs.WebpackExternalItemFunctionData>} data
 * @param {typedefs.WpwBuild} build
 */
const logAsset = (data, build) =>
{
	if (data && data.request)
	{
		build.logger.write(`   externals: process asset italic(${data.request})`);
		build.logger.value("      context", data.context);
		build.logger.value("      dependencyType", data.dependencyType);
		build.logger.value("      request", data.request);
		if (data.contextInfo)
		{
			build.logger.value("      issuer", data.contextInfo.issuer);
			build.logger.value("      issuer layer", data.contextInfo.issuerLayer);
			// `compiler` value isin form `vscode-taskexplorer|undefined|extension|test|node|none`
			build.logger.value("      compiler / wpconfig exports.name", data.contextInfo.compiler);
		}
	}
};


module.exports = externals;
