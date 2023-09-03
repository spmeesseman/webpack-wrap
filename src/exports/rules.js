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
 */

const esbuild = require("esbuild");
const { existsSync } = require("fs");
const WpwBase = require("../core/base");
const WpBuildApp = require("../core/app");
const { resolve, join } = require("path");
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WpBuildError, uniq, merge, apply, getExcludes, isJsTsConfigPath } = require("../utils");

/** @typedef {typedefs.WpwSourceCodeConfig} RulesConfig */


const builds =
{
	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	jsdoc: (app, rulesConfig) =>
	{
		const jsdocOptions = WpwBase.getOptionsConfig("jsdoc", app.build.options);
		if (jsdocOptions.type === "entry")
		{
			const exclude = getExcludes(app, rulesConfig),
				include = getIncludes(app, rulesConfig),
				jsdocSrcPath= app.getSrcPath();

			if (existsSync(jsdocSrcPath))
			{
				app.wpc.module.rules.push(
				{
					include, // : jsdocSrcPath,
					exclude,
					test: /\.(?:c|m)?js$/,
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
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @param {RulesConfig} rulesConfig
	 * @throws {WpBuildError}
	 */
	module: (app, rulesConfig) =>
	{
		const exclude = getExcludes(app, rulesConfig),
			  include = getIncludes(app, rulesConfig);

		if (app.build.debug)
		{
			app.wpc.module.rules.push(
			{
				include,
				exclude,
				test: /\.ts$/,
				issuerLayer: "release",
				// include(resourcePath, issuer) {
				// 	console.log(`  context: ${app.wpc.context} (from ${issuer})`);
				// 	console.log(`  resourcePath: ${resourcePath} (from ${issuer})`);
				// 	console.log(`  included: ${path.relative(app.wpc.context || ".", resourcePath)} (from ${issuer})`);
				// 	return true; // include all
				// },
				loader: "string-replace-loader",
				options: stripLoggingOptions()
			},
			{
				include,
				exclude,
				test: /wrapper\.ts$/,
				issuerLayer: "release",
				loader: "string-replace-loader",
				options: {
					search: /^log\.(?:write2?|error|warn|info|values?|method[A-Z][a-z]+)\]/g,
					replace: "() => {}]"
				}
			});
		}

		app.wpc.module.rules.push(
		{
			include,
			exclude,
			test: /\.ts$/,
			use: getTypescriptLoader(app, rulesConfig)
		});
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 */
	tests: (app, rulesConfig) =>
	{
		const buildPath = app.getRcPath("base");

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

		if (app.build.source.type === "typescript")
		{
			app.wpc.module.rules.push(
			{
				test: /\.ts$/,
				include: getIncludes(app, rulesConfig),
				use: getTypescriptLoader(app, rulesConfig, "babel"),
				exclude: getExcludes(app, rulesConfig, true)
			});
		}
	},


	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	types: (app, rulesConfig) =>
	{
		const typesConfig = WpwBase.getOptionsConfig("types", app.build.options);
		if (typesConfig && typesConfig.mode !== "module") {
			return;
		}

		const typesSrcPath= app.getSrcPath({ build: app.build.name }),
			  typesDirDist = app.getDistPath({ build: app.build.name });

		if (typesSrcPath && existsSync(typesSrcPath))
		{
			app.wpc.module.rules.push(
			{
				test: /\.js$/i,
				// type: "asset/resource",
				generator: {
					emit: false
				}
			}); // ,
			// {
			// 	test: /\.ts$/, // TODO - Loader for DTS bundle
			// 	use:
			// 	{
			// 		loader: resolve(__dirname, "../loaders/dts.js"),
			// 		options: {}
			// 	}
			// });
			if (app.build.source.type === "typescript")
			{
				const loader = getTypescriptLoader(app, rulesConfig);
				// mainSrcPath = app.getSrcPath({ build: mainApp.build.name, rel: true, ctx: true, dot: true, psx: true });
				// tsConfig.include.push(typesDir);
				if (loader.loader === "ts-loader")
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
							declarationDir: typesDirDist,
							//
							// emitDeclarationsOnly:
							// See `plugins/vendormod`, setting this flag will skip ts-loader entry output check
							//
							emitDeclarationsOnly: true, // !tsCheckerEnabled,
							noEmit: false // tsCheckerEnabled
						}
					});
				}
				else {
					// TODO - Babel / esbuild loader
				}
				app.wpc.module.rules.push({
					use: loader,
					test: /\.ts$/,
					// include: uniq([ mainSrcPath, typesSrcPath ]),
					include: getIncludes(app, rulesConfig),
					exclude: getExcludes(app, rulesConfig, false, true, true)
				});
			}
		}
	},


	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	webapp: (app, rulesConfig) =>
	{
		const exclude = getExcludes(app, rulesConfig);

		app.wpc.module.rules.push(
		{
			exclude,
			test: /\.m?js/,
			resolve: { fullySpecified: false }
		});

		if (app.build.source.type === "typescript")
		{
			app.wpc.module.rules.push(
			{
				exclude,
				test: /\.tsx?$/,
				include: getIncludes(app, rulesConfig),
				use: getTypescriptLoader(app, rulesConfig)
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
	}

};


/**
 * @param {WpBuildApp} app
 * @param {RulesConfig} rulesConfig
 * @returns {string[]}
 */
const getIncludes = (app, rulesConfig) => uniq([ app.getSrcPath(), ...rulesConfig.includeAbs ]);


/**
 * @param {WpBuildApp} app
 * @param {RulesConfig} rulesConfig
 * @param {string} [loader]
 * @returns {typedefs.WebpackRuleSetUseItem}
 */
const getTypescriptLoader = (app, rulesConfig, loader) =>
{
	if (app.cmdLine.esbuild)
	{
		return sourceLoaders.esbuild(app, rulesConfig);
	}
	if (app.build.source.type === "typescript")
	{
		if (app.cmdLine.babel)
		{
			return sourceLoaders.babel(app, rulesConfig);
		}
		return sourceLoaders.ts(app, rulesConfig);
	}
	return sourceLoaders.babel(app, rulesConfig);
};


const sourceLoaders =
{
	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	babel: (app, rulesConfig) =>
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
					app.build.source.type === "typescript" ? [ "@babel/preset-typescript" ] : []
				]
			}
		};
	},

	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	esbuild: (app, rulesConfig) =>
	{
		return {
			loader: "esbuild",
			options: {
				implementation: esbuild,
				loader: "tsx",
				target: "es2020",
				tsconfigRaw: rulesConfig.options
			}
		};
	},

	/**
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	ts: (app, rulesConfig) =>
	{
		return {
			loader: "ts-loader",
			options: {
				configFile: rulesConfig.path,
				experimentalWatchApi: false,
				logInfoToStdOut: app.build.log.level && app.build.log.level >= 0,
				logLevel: app.build.log.level && app.build.log.level >= 3 ? "info" : (app.build.log.level && app.build.log.level >= 1 ? "warn" : "error"),
				transpileOnly: true
			}
		};
	}
};

sourceLoaders.javascript = sourceLoaders.babel;
sourceLoaders.typescript = sourceLoaders.ts;


/**
 * @returns {Record<string, any>}
 */
const stripLoggingOptions = () => ({
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
 * @see {@link https://webpack.js.org/configuration/rules webpack.js.org/rules}
 *
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @throws {WpBuildError}
 */
const rules = (app) =>
{
	app.logger.start("create rules", 2);

	const tsConfig = merge({}, app.build.source.config); // make a merged clone, 'include' will be altered
	if (isJsTsConfigPath(tsConfig.path)) {
		app.logger.value("   using js/ts config file", tsConfig.path, 2);
	}

	const buildFn = builds[app.build.name] || builds[app.build.type];
	if (buildFn)
	{
		app.logger.write(`   create rules for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
		buildFn(app, tsConfig);
	}
	else {
		throw WpBuildError.getErrorProperty("rules", "exports/rules.js", app.wpc);
	}

	app.logger.write("   rules created successfully", 2);
};


module.exports = rules;
