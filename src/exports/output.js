// @ts-check

const { apply, isString, WpwRegex } = require("../utils");

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

/** @typedef {import("../core/build")} WpwBuild */
/** @typedef {import("../types").WebpackPathData}  WebpackPathData */
/** @typedef {import("../types").WebpackAssetInfo}  WebpackAssetInfo */
/** @typedef {import("../types").RequireKeys<WebpackPathData, "filename" | "chunk">} WebpackPathDataOutput */


const outputEnvironment = (build) =>
{
	if (build.type === "tests")
	{
		build.wpc.output.environment = {
			arrowFunction: false
		};
	}
};


/**
 * @see {@link https://webpack.js.org/configuration/output webpack.js.org/output}
 *
 * @function
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const output = (build) =>
{
	build.logger.start("create output configuration", 2);

	apply(build.wpc.output,
	{
		path: build.getDistPath(),
		filename: "[name].js",
		compareBeforeEmit: true,
		hashDigestLength: 20
		// clean: build.clean ? (build.isTests ? { keep: /(test)[\\/]/ } : build.clean) : undefined
	});

	build.logger.write(`   configure output for build '${build.name}' [ type: ${build.type} ]`, 2);

	if (build.type === "webapp")
	{
		apply(build.wpc.output,
		{
			// clean: build.clean ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			publicPath: build.vscode?.type === "webview" ? "#{webroot}/" : (process.env.ASSET_PATH || "/"),
			/**
			 * @param {WebpackPathData} pathData
			 * @param {WebpackAssetInfo | undefined} _assetInfo
			 * @returns {string}
			 */
			filename: (pathData, _assetInfo) =>
			{
				let name = "[name]";
				if (build.options.web?.filename?.camelToDash && pathData.chunk?.name)
				{
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
					build.logger.write(`   convert chunk name to '${name}' from ${pathData.chunk.name} as configured by transform`, 4);
				}
				if (build.options.web?.filename?.jsDirectory)
				{
					build.logger.write(`   set output filename to 'js/${name}.js' as configured by transform`, 4);
					return `js/${name}.js`;
				}
				return `${name}.js`;
			}
		});

		if (build.vscode?.type === "webview")
		{
			build.logger.write("   set publicPath to '#{webroot}/' for vscode build", 3);
			build.wpc.output.publicPath = "#{webroot}/";
		}

		if (build.options.web?.publicPath)
		{
			build.logger.write(`   set publicPath to configured value '${build.options.web.publicPath}'`, 3);
			build.wpc.output.publicPath = build.options.web.publicPath;
		}

		if (isString(build.wpc.output.publicPath) && !build.wpc.output.publicPath.endsWith("/")) {
			build.wpc.output.publicPath += "/";
		}
	}
	else if (build.type === "tests")
	{
		build.logger.write("   set test build library target to 'umd", 3);
		apply(build.wpc.output,
		{
			libraryTarget: "umd",
			umdNamedDefine: true
		});
	}
	else if (build.type === "jsdoc")
	{
	}
	else if (build.type === "types")
	{
		// apply(build.wpc.output,
		// {
		// 	// libraryTarget: "commonjs2"
		// 	// publicPath: "types/"
		// 	// library: "types",
		// 	// libraryTarget: 'umd',
		// 	// umdNamedDefine: true
		// });
	}
	else if (build.type === "app") // type: module / main
	{
		apply(build.wpc.output,
		{
			libraryTarget: "commonjs2",
			filename: (pathData, _assetInfo) =>
			{
				const data = /** @type {WebpackPathDataOutput} */(pathData);
				return WpwRegex.TestsChunk.test(data.chunk.name || "") ? "[name].js" : "[name].[contenthash].js";
			}
		});
	}
	else {
		apply(build.wpc.output,
		{
			libraryTarget: "commonjs2"
		});
	}

	outputEnvironment(build);

	build.logger.success("   create output configuration", 2);
};


module.exports = output;
