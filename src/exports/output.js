// @ts-check

const { apply } = require("../utils/utils");
const { RegexTestsChunk } = require("../utils");

/**
 * @file exports/output.js
 * @version 0.0.1
 * @license MIT
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
		hashDigestLength: 20,
		libraryTarget: "commonjs2"
		// clean: app.clean ? (app.isTests ? { keep: /(test)[\\/]/ } : app.clean) : undefined
	});

	app.logger.write(`   configure output for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);

	if (app.build.type === "webapp")
	{
		apply(app.wpc.output,
		{
			// clean: app.clean ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			libraryTarget: undefined,
			publicPath: "#{webroot}/",
			/**
			 * @param {WebpackPathData} pathData
			 * @param {WebpackAssetInfo | undefined} _assetInfo
			 * @returns {string}
			 */
			filename: (pathData, _assetInfo) =>
			{
				let name = "[name].js";
				if (pathData.chunk?.name) {
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
				}
				return `js/${name}.js`;
			}
		});
	}
	else if (app.build.type === "tests")
	{
		apply(app.wpc.output,
		{
			libraryTarget: "umd",
			umdNamedDefine: true
		});
	}
	else if (app.build.type === "types")
	{
		apply(app.wpc.output,
		{
		    libraryTarget: undefined
			// publicPath: "types/"
			// library: "types",
			// libraryTarget: 'umd',
			// umdNamedDefine: true
		});
	}
	else // type: module
	{
		app.wpc.output.filename = (pathData, _assetInfo) =>
		{
			const data = /** @type {WebpackPathDataOutput} */(pathData);
			return RegexTestsChunk.test(data.chunk.name || "") ? "[name].js" : "[name].[contenthash].js";
		};
	}

	app.logger.write("   output configuration created successfully", 2);
};


module.exports = output;
