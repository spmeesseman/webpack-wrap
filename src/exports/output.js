// @ts-check

const { apply, isString } = require("../utils/utils");
const { RegexTestsChunk } = require("../utils");

/**
 * @file exports/output.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/output webpack.js.org/output}
 *
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackPathData}  WebpackPathData */
/** @typedef {import("../types").WebpackAssetInfo}  WebpackAssetInfo */
/** @typedef {import("../types").RequireKeys<WebpackPathData, "filename" | "chunk">} WebpackPathDataOutput */


const outputEnvironment = (app) =>
{
	if (app.build.type === "tests")
	{
		app.wpc.output.environment = {
			arrowFunction: false
		};
	}
};


/**
 * @see {@link https://webpack.js.org/configuration/output webpack.js.org/output}
 *
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const output = (app) =>
{
	app.logger.start("create output configuration", 2);

	apply(app.wpc.output,
	{
		path: app.getDistPath(),
		filename: "[name].js",
		compareBeforeEmit: true,
		hashDigestLength: 20
		// clean: app.clean ? (app.isTests ? { keep: /(test)[\\/]/ } : app.clean) : undefined
	});

	app.logger.write(`   configure output for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);

	if (app.build.type === "webapp")
	{
		apply(app.wpc.output,
		{
			// clean: app.clean ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			publicPath: app.build.vscode?.type === "webview" ? "#{webroot}/" : (process.env.ASSET_PATH || "/"),
			/**
			 * @param {WebpackPathData} pathData
			 * @param {WebpackAssetInfo | undefined} _assetInfo
			 * @returns {string}
			 */
			filename: (pathData, _assetInfo) =>
			{
				let name = "[name]";
				if (app.build.options.web?.filename?.camelToDash && pathData.chunk?.name)
				{
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
					app.logger.write(`   convert chunk name to '${name}' from ${pathData.chunk.name} as configured by transform`, 4);
				}
				if (app.build.options.web?.filename?.jsDirectory)
				{
					app.logger.write(`   set output filename to 'js/${name}.js' as configured by transform`, 4);
					return `js/${name}.js`;
				}
				return `${name}.js`;
			}
		});

		if (app.build.vscode?.type === "webview")
		{
			app.logger.write("   set publicPath to '#{webroot}/' for vscode build", 3);
			app.wpc.output.publicPath = "#{webroot}/";
		}

		if (app.build.options.web?.publicPath)
		{
			app.logger.write(`   set publicPath to configured value '${app.build.options.web.publicPath}'`, 3);
			app.wpc.output.publicPath = app.build.options.web.publicPath;
		}

		if (isString(app.wpc.output.publicPath) && !app.wpc.output.publicPath.endsWith("/")) {
			app.wpc.output.publicPath += "/";
		}
	}
	else if (app.build.type === "tests")
	{
		app.logger.write("   set test build library target to 'umd", 3);
		apply(app.wpc.output,
		{
			libraryTarget: "umd",
			umdNamedDefine: true
		});
	}
	else if (app.build.type === "types")
	{
		// apply(app.wpc.output,
		// {
		// 	// libraryTarget: "commonjs2"
		// 	// publicPath: "types/"
		// 	// library: "types",
		// 	// libraryTarget: 'umd',
		// 	// umdNamedDefine: true
		// });
	}
	else if (app.build.type === "module") // type: module / main
	{
		apply(app.wpc.output,
		{
			libraryTarget: "commonjs2",
			filename: (pathData, _assetInfo) =>
			{
				const data = /** @type {WebpackPathDataOutput} */(pathData);
				return RegexTestsChunk.test(data.chunk.name || "") ? "[name].js" : "[name].[contenthash].js";
			}
		});
	}
	else {
		apply(app.wpc.output,
		{
			libraryTarget: "commonjs2"
		});
	}

	outputEnvironment(app);

	app.logger.write("   output configuration created successfully", 2);
};


module.exports = output;
