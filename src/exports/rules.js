/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/exports/rules.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description @see {@link https://webpack.js.org/configuration/rules webpack.js.org/rules}
 *
 *//** */

const esbuild = require("esbuild");
const { existsSync } = require("fs");
const { resolve, join } = require("path");
const WpwWebpackExport = require("./base");
const { getExcludes } = require("../utils");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { apply, isFunction, merge } = require("@spmeesseman/type-utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwRulesExport extends WpwWebpackExport
{
	/**
     * @param {typedefs.WpwExportOptions} options
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"rules">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build }); e.create(); return e; };


	/**
	 * @private
	 * @param {string | RegExp} test
	 * @param {string} includePath
	 * @param {typedefs.WpwReplacePair[]} searchReplaceArr
	 */
	addVendorReplaceRule(test, includePath, searchReplaceArr)
	{
		const loader = "string-replace-loader",
			  basePath = this.build.getBasePath(),
		      options = {
			      multiple: searchReplaceArr.map(o => ({ search: o[0], replace: o[1] }))
			  };

		let include = join(basePath, "node_modules", ...includePath.split("/"));
		if (existsSync(include))
		{
			this.build.wpc.module.rules.push({ include, test, options, loader });
		}

		include = join(basePath, "@spmeesseman", "webpack-wrap", "node_modules", ...include.split("/"));
		if (existsSync(include))
		{
			this.build.wpc.module.rules.push({ include, test, options, loader });
		}
	}


	/**
	 * @override
	 */
	app()
	{
		const build = this.build,
			  exclude = getExcludes(build),
			  include = this.build.getSrcPath();

		if (build.debug)
		{
			build.wpc.module.rules.push(
			{
				include,
				exclude,
				test: new RegExp(`${build.source.dotext}$`),
				issuerLayer: "release",
				// include(resourcePath, issuer) {
				// 	console.log(`  context: ${build.wpc.context} (from ${issuer})`);
				// 	console.log(`  resourcePath: ${resourcePath} (from ${issuer})`);
				// 	console.log(`  included: ${path.relative(build.wpc.context || ".", resourcePath)} (from ${issuer})`);
				// 	return true; // include all
				// },
				loader: "string-replace-loader",
				options: this.stripLoggingOptions()
			},
			{
				include,
				exclude,
				test: new RegExp(`wrapper${build.source.dotext}$`),
				issuerLayer: "release",
				loader: "string-replace-loader",
				options: {
					search: /^log\.(?:write2?|error|warn|info|values?|method[A-Z][a-z]+)\]/g,
					replace: "() => {}]"
				}
			});
		}

		const loader = this.getSourceLoader();

		if (build.source.type === "typescript")
		{
			// mainSrcPath = build.getSrcPath({ build: mainApp.build.name, rel: true, ctx: true, dot: true, psx: true });
			// tsConfig.include.push(typesDir);
			if (loader.loader === "ts-loader" && build.options.types)
			{
				const tsCheckerEnabled = !!build.options.tscheck;
				apply(loader.options,
				{
					transpileOnly: tsCheckerEnabled,
					// reportFiles: [
					// 	"src/**/*.{ts,tsx}", "!src/taskexplorer.ts"
					// ],
					compilerOptions: {
						declaration: true,
						declarationMap: false,
						//
						// emitDeclarationsOnly:
						// See `plugins/vendormod`, setting this flag will skip ts-loader entry output check
						//
						// emitDeclarationsOnly: true, // !tsCheckerEnabled,
						noEmit: false // tsCheckerEnabled
					}
				});
				const declarationDir = build.source.config.compilerOptions.declarationDir ||
									   build.getDistPath({ build: "types" });
				if (declarationDir) {
					loader.options.compilerOptions.declarationDir = declarationDir;
				}
			}
			else {
				// TODO - Babel / esbuild loader for type defs
			}

			build.wpc.module.rules.push({
				use: loader,
				test: /\.tsx?$/,
				include,
				exclude: getExcludes(build, false, true, true)
			});
		}
		else
		{
			build.wpc.module.rules.push(
			{
				test: /\.tsx?$/,
				use: this.getSourceLoader("babel", true),
				// exclude: /\.d\.ts$/,
				include: resolve(__dirname, "../../node_modules"),
				exclude: [ new RegExp(this.build.getSrcPath({ rel: true, psx: true })), ...getExcludes(build, false, false, true, true) ]
			},
			{
				use: loader,
				test: /\.jsx?$/,
				include,
				exclude: getExcludes(build)
			});
		}
	}


	/**
	 * @override
	 * @throws {WpwError}
	 */
	create()
	{
		const build= this.build;
		build.logger.start("create rules", 2);
		if (isFunction(this[build.type]))
		{
			build.logger.write(`   create rules for build '${build.name}' [ type: ${build.type} ]`, 2);
			this[build.type]();
			// if (build.logger.level >= 3)
			// {
			// 	build.wpc.module.rules.push({
			// 		include: this.build.getSrcPath(),
			// 		exclude: getExcludes(build),
			// 		test: (path) => {
			// 			console.log(path);
			// 			return false; // (/\.(j|t)sx?$/).test(path);
			// 		},
			// 		// loader: resolve(__dirname, "../loaders/dts.js"),
			// 		// loader: "wpw-logrequest-loader",
			// 		// options: {
			// 		// 	inputDir: build.getSrcPath()
			// 		// }
			// 	});
			// }
		}
		else {
			this.build.addMessage({ code: WpwError.Code.ERROR_SHITTY_PROGRAMMER, message: `exports.rules.build[${build.type}]` });
		}
		build.logger.success("   create rules", 2);
	}


	/**
	 * @private
	 * @param {"esbuild" | "babel" | "ts"} [loader]
		 * @param {boolean} [ts]
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	getSourceLoader = (loader, ts) =>
	{
		const build= this.build;
		if (build.cmdLine.esbuild || loader === "esbuild")
		{
			return this.sourceLoaders.esbuild();
		}
		if (build.source.type === "typescript")
		{
			if (build.cmdLine.babel || loader === "babel")
			{
				return this.sourceLoaders.babel(true);
			}
			return this.sourceLoaders.ts();
		}
		return this.sourceLoaders.babel(ts);
	};


	/**
	 * The `jsdoc` module is a {@link WpwBaseTaskPlugin} type module, using a virtual file so that
	 * Webpack runs through it's normal process as if it going to bundle ts/js code.  This scenario
	 * is used when the build really isn't a Webpack bundling, but more of something that usually
	 * a task runner would handle, e.g this `jsdoc` build or the `types` build.  They are implememnted
	 * here in an effort to condense all tasks to Webpavk only, where something like Gulp, Grunt, Ant,
	 * etc is not needed, especially for several smaller projects.
	 *
	 * @override
	 * @throws {WpwError}
	 */
	jsdoc()
	{
		const build = this.build,
			  jsdocConfig = this.build.options.jsdoc;

		if (!build.wpc.entry[build.name]) {
			build.addMessage({
				code: WpwError.Code.ERROR_CONFIG_INVALID_EXPORTS,
				message: "rules[types]: wpc.entry must be initialized before wpc.rules"
			});
			return;
		}

		if (jsdocConfig && jsdocConfig.enabled !== false)
		{
			build.logger.write(`   add rule for virtual entry file '${this.virtualFile}'`, 2);
			build.wpc.module.rules.push(
			{
				loader: "wpw-jsdoc-loader",
				include: this.build.global.cacheDir,
				test: new RegExp(`[\\\\\\/]${this.virtualFile}$`),
				options: {
					entry: build.entry,
					config: jsdocConfig,
					ext: build.source.dotext,
					outDir: build.getDistPath(),
					inputDir: build.getSrcPath(),
					virtualFile: this.virtualFilePath
				}
			});
		}
	}


	/**
	 * @override
	 */
	script()
	{
		const build = this.build,
			  config = build.options.script;
		if (config && config.enabled !== false)
		{

		}
	}


	/**
	 * @private
	 */
	sourceLoaders =
	{
		/**
		 * @param {boolean} [ts]
		 * @returns {typedefs.WebpackRuleSetUseItem}
		 */
		babel: (ts) =>
		{
			const config = {
				loader: "babel-loader",
				options: {
					// cwd: resolve(__dirname, "..", ".."), // resolve node_mdules/presets in wpw base dir
					presets: [
						[ "@babel/preset-env", {
							/* targets: {
								node: "16.20.0"
							}*/
							targets: "defaults"
						}]
					]
				}
			};
			if (ts)
			{
				config.options.presets.push([ "@babel/preset-typescript" ]);
			}
			return config;
		},

		/**
		 * @returns {typedefs.WebpackRuleSetUseItem}
		 */
		esbuild: () =>
		{
			return {
				loader: "esbuild",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: "es2020",
					tsconfigRaw: this.build.source.configFile.raw
				}
			};
		},

		/**
		 * @returns {typedefs.WebpackRuleSetUseItem}
		 */
		ts: () =>
		{
			const logOptions = this.build.log;
			return {
				loader: "ts-loader",
				options: {
					configFile: this.build.source.configFile.path,
					experimentalWatchApi: false,
					logInfoToStdOut: logOptions.level && logOptions.level >= 0,
					logLevel: logOptions.level && logOptions.level >= 3 ? "info" : (logOptions.level && logOptions.level >= 1 ? "warn" : "error"),
					transpileOnly: true
				}
			};
		}
	};


	/**
	 * @private
	 * @returns {Record<string, any>}
	 */
	stripLoggingOptions = () => ({
		multiple: [
		{
			search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\)\s*\}\);/g,
			replace: (/** @type {string} */r) => {
				return "=> {}\r\n" + r.substring(r.slice(0, r.length - 3).lastIndexOf(")") + 1);
			}
		},
		{
			search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2|info|values?|method[A-Z][a-z]+)\s*\([^]*?\),/g,
			replace: "=> {},"
		},
		{
			search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\) *;/g,
			replace: "=> {};"
		},
		{
			search: /(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\)\s*;\s*?(?:\r\n|$)/g,
			replace: "\r\n"
		},
		{
			search: /this\.wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
			replace: "this.wrapper.emptyFn,"
		},
		{
			search: /wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
			replace: "wrapper.emptyFn,"
		},
		{
			search: /w\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
			replace: "w.emptyFn,"
		},
		{
			search: /this\.wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
			replace: "this.wrapper.emptyFn]"
		},
		{
			search: /wrapper\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
			replace: "wrapper.emptyFn]"
		},
		{
			search: /w\.log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
			replace: "w.emptyFn]"
		}]
	});


	/**
	 * @override
	 */
	tests()
	{
		const build= this.build;
		if (build.source.type === "typescript")
		{
			build.wpc.module.rules.push(
			{
				test: /\.tsx?$/,
				include: build.getSrcPath(),
				use: this.getSourceLoader("babel"),
				exclude: getExcludes(build, true)
			});
		}

		this.addVendorReplaceRule(
			/index\.js$/, "nyc",
			[[ "selfCoverageHelper = require('../self-coverage-helper')", "selfCoverageHelper = { onExit () {} }" ]]
		);
	}


	/**
	 * The `types` module is a {@link WpwBaseTaskPlugin} type module, using a virtual file so that
	 * Webpack runs through it's normal process as if it going to bundle ts/js code.  This scenario
	 * is used when the build really isn't a Webpack bundling, but more of something that usually
	 * a task runner would handle, e.g this `types` build or the `jsdoc` build.  They are implememnted
	 * here in an effort to condense all tasks to Webpavk only, where something like Gulp, Grunt, Ant,
	 * etc is not needed, especially for several smaller projects.
	 *
	 * @override
	 * @throws {WpwError}
	 */
	types()
	{
		const build = this.build,
			  typesConfig = build.options.types;

		if (typesConfig && (typesConfig.mode === "loader" || typesConfig.mode === "plugin"))
		{
			build.logger.write(`   add rule for virtual entry file '${this.virtualFile}'`, 2);
			build.wpc.module.rules.push(
			{
				loader: "wpw-types-loader",
				include: this.build.global.cacheDir,
				test: new RegExp(`[\\\\\\/]${this.virtualFile}$`),
				options: {
					entry: build.entry,
					config: typesConfig,
					ext: build.source.dotext,
					outDir: build.getDistPath(),
					inputDir: build.getSrcPath(),
					virtualFile: this.virtualFilePath
				}
			});
		}
	}


	/**
	 * @override
	 */
	webapp()
	{
		const build = this.build,
			  exclude = getExcludes(build);

		build.wpc.module.rules.push(
		{
			exclude,
			test: /\.m?js/,
			resolve: { fullySpecified: false }
		});

		if (build.source.type === "typescript")
		{
			build.wpc.module.rules.push(
			{
				exclude,
				test: /\.tsx?$/,
				include: this.build.getSrcPath(),
				use: this.getSourceLoader()
			});
		}

		build.wpc.module.rules.push(
		{
			exclude,
			test: /\.s?css$/,
			use: [{
				loader: MiniCssExtractPlugin.loader
			},
			{
				loader: "css-loader",
				options: {
					sourceMap: build.wpc.mode !== "production",
					url: false
				}
			},
			{
				loader: "sass-loader",
				options: {
					sourceMap: build.wpc.mode !== "production"
				}
			}]
		});
	};

};


module.exports = WpwRulesExport.create;
