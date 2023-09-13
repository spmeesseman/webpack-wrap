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
const { existsSync, readdirSync } = require("fs");
const { resolve, join } = require("path");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WpwError, uniq, apply, getExcludes, isJsTsConfigPath, isFunction, findFilesSync, isArray, merge } = require("../utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwRulesExport extends WpwWebpackExport
{
	/**
     * @param {typedefs.WpwExportOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build}); e.create(); return e; };


	/**
	 * @private
	 * @param {string | RegExp} test
	 * @param {string} includePath
	 * @param {[string | RegExp, string ][]} searchReplaceArr
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
			  exclude = getExcludes(build, this.build.source.config),
			  include = this.getIncludes();

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

		if (build.source.type === "typescript")
		{
			const loader = this.getSourceLoader();
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
				const declarationDir = build.source.config.options.compilerOptions.declarationDir ||
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
				test: build.source.ext !== "ts" ?  /\.js$/ : /\.ts$/,
				// include: uniq([ mainSrcPath, typesSrcPath ]),
				include: this.getIncludes(),
				exclude: getExcludes(build, this.build.source.config, false, true, true)
			});
		}
	}


	/**
	 * @override
     * @protected
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
		}
		else {
			this.build.addMessage({ code: WpwError.Msg.ERROR_SHITTY_PROGRAMMER, message: `exports.rules.build[${build.type}]` });
		}
		build.logger.success("create rules", 2);
	}


	/**
	 * @private
	 * @returns {string[]}
	 */
	getIncludes = () => uniq([ this.build.getSrcPath(), ...this.build.source.config.includeAbs ]);


	/**
	 * @private
	 * @param {"esbuild" | "babel" | "ts"} [loader]
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	getSourceLoader = (loader) =>
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
				return this.sourceLoaders.babel();
			}
			return this.sourceLoaders.ts();
		}
		return this.sourceLoaders.babel();
	};


	/**
	 * @override
	 * @throws {WpwError}
	 */
	jsdoc()
	{
		const build = this.build,
			  jsdocOptions = build.options.jsdoc;
		if (jsdocOptions && jsdocOptions.type === "entry")
		{
			const exclude = getExcludes(build, build.source.config),
				include = this.getIncludes(),
				jsdocSrcPath= build.getSrcPath();

			if (existsSync(jsdocSrcPath))
			{
				build.wpc.module.rules.push(
				{
					include, // : jsdocSrcPath,
					exclude,
					test: new RegExp(`\\.(?:c|m)?${build.source.ext}x?$`),
					generator: {
						emit: false
					},
					use:
					{
						loader: "wpw-jsdoc-loader",
						options: {
							outDir: build.getDistPath(),
							rootDir: jsdocSrcPath
						}
					}
				});
			}
			else {
				build.addMessage({ code: WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS, message: "rules[jsdoc]" });
			}
		}
		else {
			build.addMessage({ code: WpwError.Msg.ERROR_CONFIG_INVALID_EXPORTS, message: "rules[jsdoc]" });
		}
	}


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
						this.build.source.type === "typescript" ? [ "@babel/preset-typescript" ] : []
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
					tsconfigRaw: this.build.source.config.raw
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
					configFile: this.build.source.config.path,
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
				include: this.getIncludes(),
				use: this.getSourceLoader("babel"),
				exclude: getExcludes(build, this.build.source.config, true)
			});
		}

		this.addVendorReplaceRule(
			/index\.js$/, "nyc",
			[[ "selfCoverageHelper = require('../self-coverage-helper')", "selfCoverageHelper = { onExit () {} }" ]]
		);
	}


	/**
	 * @override
	 * @throws {WpwError}
	 */
	types()
	{
		const build = this.build,
			  typesConfig = build.options.types;

		if (!build.wpc.entry[build.name]) {
			build.addMessage({
				code: WpwError.Msg.ERROR_CONFIG_INVALID_EXPORTS,
				message: "rules[types]: wpc.entry must be initialized before wpc.rules"
			});
			return;
		}

		if (typesConfig && (typesConfig.mode === "loader" || typesConfig.mode === "plugin"))
		{
			const fakeEntryFile = /** @type {string} */(build.wpc.entry[this.build.name]).replace(/^\.[\/\\]/, "");
			build.logger.write(`   add rule for virtual entry file '${fakeEntryFile}'`, 2);
			build.wpc.module.rules.push(
			{
				test: new RegExp(`${fakeEntryFile.replace(/[\\\/]/g, "[\\\\\\/]")}$`),
				// loader: resolve(__dirname, "../loaders/dts.js"),
				loader: "wpw-types-loader",
				options: merge({ virtualFile: `${build.global.cacheDir}/${build.name}${build.source.dotext}` }, { typesConfig })
			});
		}
	}


	/**
	 * @override
	 */
	webapp()
	{
		const build = this.build,
			  exclude = getExcludes(build, this.build.source.config);

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
				include: this.getIncludes(),
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
