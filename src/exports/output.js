// @ts-check

const WpwRegex = require("../utils/regex");
const WpwWebpackExport = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { apply, isString, isFunction } = require("@spmeesseman/type-utils");

/**
 * @file src/exports/output.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description @see {@link https://webpack.js.org/configuration/output webpack.js.org/output}
 *
 *//** */

 /**
  * @extends {WpwWebpackExport}
  */
 class WpwOutputExport extends WpwWebpackExport
 {
	/**
     * @param {typedefs.WpwExportOptions} options
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"output">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create = WpwOutputExport.wrap.bind(this);


    /**
     * @override
     */
    app()
    {
        apply(this.build.wpc.output,
		{
			libraryTarget: "commonjs2",
			filename: (pathData, _assetInfo) =>
			{
				const data = /** @type {typedefs.WebpackPathDataOutput} */(pathData);
				return !this.buildOptions.hash || WpwRegex.TestsChunk.test(data.chunk.name || "") ? "[name].js" : "[name].[contenthash].js";
			}
		});
    }


	/**
	 * @override
	 */
	create()
	{
		const build = this.build;
		build.logger.start("create output configuration", 2);
		apply(build.wpc.output,
		{
			path: build.getDistPath(),
			filename: "[name].js",
			compareBeforeEmit: true,
			hashDigestLength: this.hashDigestLength
			// clean: build.clean ? (build.isTests ? { keep: /(test)[\\/]/ } : build.clean) : undefined
		});

		if (isFunction(this[build.type]))
		{
			build.logger.write(`   create output config for build '${build.name}' [ type: ${build.type} ]`, 2);
			this[build.type]();
		}
		else {
			this.build.addMessage({ code: WpwError.Code.ERROR_SHITTY_PROGRAMMER, message: `exports.rules.build[${build.type}]` });
		}

		build.logger.success("   create output configuration", 2);
	};


    /**
     * @override
     */
    jsdoc()
    {
		// apply(this.build.wpc.output,
		// {
		// 	libraryTarget: "commonjs2"
		// });
    }


	/**
	 * @override
	 */
	script()
	{
		// const build = this.build,
		// 	  config = build.options.script;
		// if (config && config.enabled !== false)
		// {
		//
		// }
	}


    /**
     * @override
     */
    tests()
    {
		this.build.logger.write("   set test build library target to 'umd", 3);
		apply(this.build.wpc.output,
		{
			libraryTarget: "umd",
			umdNamedDefine: true,
			environment: {
				arrowFunction: false
			}
		});
    }


    /**
     * @override
     * @protected
     */
    types()
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


    /**
     * @override
     * @protected
     */
    webapp()
    {
		const build = this.build;
        apply(build.wpc.output,
		{
			// clean: build.clean ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			publicPath: build.vscode?.type === "webview" ? "#{webroot}/" : (process.env.ASSET_PATH || "/"),
			/**
			 * @param {typedefs.WebpackPathData} pathData
			 * @param {typedefs.WebpackAssetInfo | undefined} _assetInfo
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

 }


module.exports = WpwOutputExport.create;
