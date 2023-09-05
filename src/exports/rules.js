/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file exports/rules.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/rules webpack.js.org/rules}
 *
 *//** */

const esbuild = require("esbuild");
const { existsSync } = require("fs");
const WpwBase = require("../core/base");
const WpBuildApp = require("../core/app");
const { resolve, join } = require("path");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WpBuildError, uniq, merge, apply, getExcludes, isJsTsConfigPath, isFunction } = require("../utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwRulesExport extends WpwWebpackExport
{
	/**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		if (isJsTsConfigPath(this.app.source.config.path)) {
			this.app.logger.value("   use js/ts config file", this.app.source.config.path, 2);
		}
	}


	/**
     * @override
     * @param {typedefs.WpBuildApp} app
     */
	static build = (app) => { const e = new this({ app }); e.build(); return e; };


	/**
	 * @override
     * @protected
	 * @throws {WpBuildError}
	 */
	build = () =>
	{
		const app = this.app;
		app.logger.start("create rules", 2);
		if (isFunction(this[app.build.type]))
		{
			app.logger.write(`   create rules for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
			this[app.build.type]();
		}
		else {
			throw WpBuildError.getErrorProperty("rules", "exports/rules.js", app.wpc);
		}
		app.logger.success("create rules", 2);
	};


	/**
	 * @private
	 * @throws {WpBuildError}
	 */
	jsdoc = () =>
	{
		const app = this.app,
			  jsdocOptions = WpwBase.getOptionsConfig("jsdoc", app);
		if (jsdocOptions.type === "entry")
		{
			const exclude = getExcludes(app, this.app.source.config),
				include = this.getIncludes(),
				jsdocSrcPath= app.getSrcPath();

			if (existsSync(jsdocSrcPath))
			{
				app.wpc.module.rules.push(
				{
					include, // : jsdocSrcPath,
					exclude,
					test: new RegExp(`\\.(?:c|m)?${app.source.ext}x?$`),
					generator: {
						emit: false
					},
					use:
					{
						loader: resolve(__dirname, "../loaders/jsdoc.js"),
						options: {
							outDir: app.getDistPath(),
							rootDir: jsdocSrcPath
						}
					}
				});
			}
			else {
				throw WpBuildError.get("jsdoc source path does not exist", "exports/rules.js", app.wpc);
			}
		}
		else {
			throw WpBuildError.getErrorProperty("rules", "exports/rules.js", app.wpc, "build not configured for jsdoc 'entry' type");
		}
	};


	/**
	 * @private
	 */
	module = () =>
	{
		const app = this.app,
			  exclude = getExcludes(app, this.app.source.config),
			  include = this.getIncludes();

		if (app.build.debug)
		{
			app.wpc.module.rules.push(
			{
				include,
				exclude,
				test: new RegExp(`\\.${app.source.ext}$`),
				issuerLayer: "release",
				// include(resourcePath, issuer) {
				// 	console.log(`  context: ${app.wpc.context} (from ${issuer})`);
				// 	console.log(`  resourcePath: ${resourcePath} (from ${issuer})`);
				// 	console.log(`  included: ${path.relative(app.wpc.context || ".", resourcePath)} (from ${issuer})`);
				// 	return true; // include all
				// },
				loader: "string-replace-loader",
				options: this.stripLoggingOptions()
			},
			{
				include,
				exclude,
				test: app.source.ext !== "ts" ?  /wrapper\.js$/ : /wrapper\.ts$/,
				issuerLayer: "release",
				loader: "string-replace-loader",
				options: {
					search: /^log\.(?:write2?|error|warn|info|values?|method[A-Z][a-z]+)\]/g,
					replace: "() => {}]"
				}
			});
		}

		if (app.source.type === "typescript")
		{
			const loader = this.getSourceLoader();
			// mainSrcPath = app.getSrcPath({ build: mainApp.build.name, rel: true, ctx: true, dot: true, psx: true });
			// tsConfig.include.push(typesDir);
			if (loader.loader === "ts-loader" && app.build.options.types)
			{
				const tsCheckerEnabled = !!app.build.options.tscheck;
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
				const declarationDir = app.source.config.options.compilerOptions.declarationDir ||
									   app.getDistPath({ build: "types" });
				if (declarationDir) {
					loader.options.compilerOptions.declarationDir = declarationDir;
				}
			}
			else {
				// TODO - Babel / esbuild loader for type defs
			}

			app.wpc.module.rules.push({
				use: loader,
				test: app.source.ext !== "ts" ?  /\.js$/ : /\.ts$/,
				// include: uniq([ mainSrcPath, typesSrcPath ]),
				include: this.getIncludes(),
				exclude: getExcludes(app, this.app.source.config, false, true, true)
			});
		}
	};


	/**
	 * @private
	 */
	tests = () =>
	{
		const app = this.app,
			  buildPath = app.getRcPath("base");

		app.wpc.module.rules.push(
		{
			test: /index\.js$/,
			include: join(buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				search: "selfCoverageHelper = require('../self-coverage-helper')",
				replace: "selfCoverageHelper = { onExit () {} }"
			}
		},
		{
			test: /index\.js$/,
			include: join(buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				search: "selfCoverageHelper = require('../self-coverage-helper')",
				replace: "selfCoverageHelper = { onExit () {} }"
			}
		});

		if (app.source.type === "typescript")
		{
			app.wpc.module.rules.push(
			{
				test: app.source.ext !== "ts" ?  /\.js$/ : /\.ts$/,
				include: this.getIncludes(),
				use: this.getSourceLoader("babel"),
				exclude: getExcludes(app, this.app.source.config, true)
			});
		}
	};


	/**
	 * @private
	 * @throws {WpBuildError}
	 */
	types = () =>
	{
		const app = this.app,
			  typesConfig = WpwBase.getOptionsConfig("types", app),
			  typesSrcPath= app.getSrcPath({ build: app.build.name });

		if (typesConfig.enabled && typesConfig.mode === "module" && typesSrcPath && existsSync(typesSrcPath))
		{
			app.wpc.module.rules.push(
			{
				test: new RegExp(`\\.${app.source.ext}$`),
				// type: "asset/resource",
				generator: {
					emit: false
				}
			});
		}
		else {
			throw WpBuildError.getErrorProperty("rules[types]", "exports/rules.js", app.wpc);
		}
	};


	/**
	 * @private
	 */
	webapp = () =>
	{
		const app = this.app,
			  exclude = getExcludes(app, this.app.source.config);

		app.wpc.module.rules.push(
		{
			exclude,
			test: /\.m?js/,
			resolve: { fullySpecified: false }
		});

		if (app.source.type === "typescript")
		{
			app.wpc.module.rules.push(
			{
				exclude,
				test: /\.tsx?$/,
				include: this.getIncludes(),
				use: this.getSourceLoader()
			});
		}

		app.wpc.module.rules.push(
		{
			exclude,
			test: /\.s?css$/,
			use: [{
				loader: MiniCssExtractPlugin.loader
			},
			{
				loader: "css-loader",
				options: {
					sourceMap: app.wpc.mode !== "production",
					url: false
				}
			},
			{
				loader: "sass-loader",
				options: {
					sourceMap: app.wpc.mode !== "production"
				}
			}]
		});
	};


	/**
	 * @private
	 * @returns {string[]}
	 */
	getIncludes = () => uniq([ this.app.getSrcPath(), ...this.app.source.config.includeAbs ]);


	/**
	 * @private
	 * @param {"esbuild" | "babel" | "ts"} [loader]
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	getSourceLoader = (loader) =>
	{
		const app = this.app;
		if (app.cmdLine.esbuild || loader === "esbuild")
		{
			return this.sourceLoaders.esbuild();
		}
		if (app.source.type === "typescript")
		{
			if (app.cmdLine.babel || loader === "babel")
			{
				return this.sourceLoaders.babel();
			}
			return this.sourceLoaders.ts();
		}
		return this.sourceLoaders.babel();
	};


	/**
	 * @private
	 */
	sourceLoaders =
	{
		/**
		 * @returns {typedefs.WebpackRuleSetUseItem}
		 */
		babel: () =>
		{
			return {
				loader: "babel-loader",
				options: {
					cwd: resolve(__dirname, "..", ".."), // resolve node_mdules/presets in wpw base dir
					presets: [
						[ "@babel/preset-env", {
							targets: {
								node: "16.20.0"
							} /* { targets: "defaults" }*/}
						],
						this.app.source.type === "typescript" ? [ "@babel/preset-typescript" ] : []
					]
				}
			};
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
					tsconfigRaw: this.app.source.config.raw
				}
			};
		},

		/**
		 * @returns {typedefs.WebpackRuleSetUseItem}
		 */
		ts: () =>
		{
			const logOptions = this.app.build.log;
			return {
				loader: "ts-loader",
				options: {
					configFile: this.app.source.config.path,
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

};


module.exports = WpwRulesExport.build;
