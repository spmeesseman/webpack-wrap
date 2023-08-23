/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file exports/rules.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/rules webpack.js.org/rules}
 *
 */

const path = require("path");
const esbuild = require("esbuild");
const { existsSync } = require("fs");
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WpBuildApp, WpBuildError, uniq, merge, apply, getExcludes } = require("../utils");

/** @typedef {typedefs.WpBuildAppTsConfig} RulesConfig */


const builds =
{
	/**
	 * @function
	 * @private
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
			use: getLoader(app, rulesConfig)
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 */
	tests: (app, rulesConfig) =>
	{
		const buildPath = app.getRcPath("base");

		app.wpc.module.rules.push(
		{
			test: /index\.js$/,
			include: path.join(buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				search: "selfCoverageHelper = require('../self-coverage-helper')",
				replace: "selfCoverageHelper = { onExit () {} }"
			}
		},
		{
			test: /\.ts$/,
			include: getIncludes(app, rulesConfig),
			use: getLoader(app, rulesConfig, "babel"),
			exclude: getExcludes(app, rulesConfig, true)
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	types: (app, rulesConfig) =>
	{
		const mainBuild = app.getAppBuild("module"),
			  typesSrcPath= app.getSrcPath({ build: app.build.name }),
			  typesDirDist = app.getDistPath({ build: app.build.name });

		if (mainBuild && typesSrcPath && existsSync(typesSrcPath))
		{
			const loader = getLoader(app, rulesConfig);
			// mainSrcPath = app.getSrcPath({ build: mainApp.build.name, rel: true, ctx: true, dot: true, psx: true });
			// tsConfig.include.push(typesDir);
			if (loader.loader === "ts-loader")
			{
				const tsCheckerEnabled = !!app.build.plugins.tscheck;
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
			app.wpc.module.rules.push(
			{
				use: loader,
				test: /\.ts$/,
				// include: uniq([ mainSrcPath, typesSrcPath ]),
				include: getIncludes(app, rulesConfig),
				exclude: getExcludes(app, rulesConfig, false, true, true)
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {RulesConfig} rulesConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	webapp: (app, rulesConfig) =>
	{
		const exclude = getExcludes(app, rulesConfig),
			  typesDir = app.getSrcPath({ build: app.build.name });

		app.wpc.module.rules.push(...[
		{
			exclude,
			test: /\.m?js/,
			resolve: { fullySpecified: false }
		},
		{
			exclude,
			test: /\.tsx?$/,
			include: getIncludes(app, rulesConfig),
			use: getLoader(app, rulesConfig)
		},
		{
			exclude,
			test: /\.s?css$/,
			use: [
			{
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
		}]);

		if (typesDir && !!app.args.build && app.rc.builds.find(b => b.type === "types" || b.name === "types")) //  && !existsSync(typesDir))
		{
			// app.wpc.module.rules.unshift(
			// {
			// exclude,
			// 	test: /\.ts$/,
			// 	include: srcPath,
			// 	exclude: [
			// 		/node_modules/, /test[\\/]/, /\.d\.ts$/
			// 	],
			// 	use: {
			// 		loader: "ts-loader",
			// 		options: {
			// 			configFile: tsConfig.path,
			// 			experimentalWatchApi: false,
			// 			transpileOnly: false,
			// 			logInfoToStdOut: app.build.log.level && app.build.log.level >= 0,
			// 			logLevel: app.build.log.level && app.build.log.level >= 3 ? "info" : (app.build.log.level && app.build.log.level >= 1 ? "warn" : "error"),
			// 			compilerOptions: {
			// 				emitDeclarationsOnly: true
			// 			}
			// 		}
			// 	}
			// });
		}
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
const getLoader = (app, rulesConfig, loader) =>
{
	if (app.args.esbuild || loader === "esbuild") {
		return buildOptions.esbuild(app, rulesConfig);
	}
	if (app.source === "javascript" || app.args.babel || loader === "babel") {
		return buildOptions.babel(app, rulesConfig);
	}
	return buildOptions.ts(app, rulesConfig);
};


const buildOptions =
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
				presets: [
					[ "@babel/preset-env", { targets: "defaults" }],
					[ "@babel/preset-typescript" ]
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
				tsconfigRaw: rulesConfig.json
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


/**
 * @function
 * @private
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
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @throws {WpBuildError}
 */
const rules = (app) =>
{
	app.logger.start("create rules", 2);

	const tsConfig = merge({}, app.tsConfig); // make a merged clone, 'include' will be altered
	if (app.source === "typescript")
	{
		if (!app.tsConfig) {
			throw WpBuildError.getErrorMissing("tsconfig file", "exports/rules.js", app.wpc);
		}
		app.logger.value("   using tsconfig file", tsConfig.path, 2);
	}
	else {
		 apply(tsConfig, { include: [], exclude: [], files: [], json: {}, raw: "", dir: "", file: "", path: "" });
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
