// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/entry-context/}
 *
 */

const { glob } = require("glob");
const { basename, resolve } = require("path");
const WpwBase = require("../core/base");
const WpBuildApp = require("../core/app");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const {
	apply, WpBuildError, isObjectEmpty, isString, isDirectory, relativePath, createEntryObjFromDir, isFunction, WpwMessageEnum
} = require("../utils");
const { existsSync } = require("fs");


/**
 * @extends {WpwWebpackExport}
 */
class WpwEntryExport extends WpwWebpackExport
{
	/** @type {string} @private */
	globTestSuiteFiles= "**/*.{test,tests,spec,specs}.ts";


    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options) { super(options); }


	/**
     * @override
     * @param {typedefs.WpBuildApp} app
     */
	static build(app) { const e = new this({ app }); e.build(); return e; };


	/**
	 * @override
     * @protected
	 * @throws {WpBuildError}
	 */
	build()
	{
		const app = this.app;
		app.logger.start("create entry points", 1);

		//
		// If the build rc defined `entry` itself, apply and we're done...
		//
		if (!isObjectEmpty(app.build.entry))
		{
			app.logger.write(`   add defined entry points for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
			apply(app.wpc.entry, app.build.entry);
		}
		else if (isFunction(this[app.build.type]))
		{
			app.logger.write(`   create entry points for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
			this[app.build.type]();
		}
		else {
			throw WpBuildError.getErrorProperty("entry", app.wpc);
		}

		//
		// Validate entry pont paths
		//
		const result = Object.values(app.wpc.entry).every((e) =>
		{
			if (!e || (!isString(e) && !e.import))
			{
				throw WpBuildError.getErrorProperty("entry", app.wpc, "entry target is invalid");
			}
			const ep = isString(e) ? e : e.import;
			if (!ep.startsWith("./"))
			{
				app.logger.warning(`entry target should contain a leading './' in path, found [${ep}]`, app.logger.level !== 0 ? "   " : "");
				return false;
			}
			return true;
		});

		if (result) {
			app.logger.success("create entry points", 2);
		}
		else {
			app.logger.write("entry points created, but with warnings", 2, "", app.logger.icons.color.warning);
		}
	}


	/**
	 * @override
	 */
	jsdoc()
	{
		const app = this.app,
			  jsdocOptions = app.build.options.jsdoc;
		if (jsdocOptions && jsdocOptions.type === "entry")
		{
			const mainBuild = app.getBuild("module"),
				jsdocSrcPath = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
			if (mainBuild && jsdocSrcPath)
			{
				const mainSrcPath = app.getSrcPath({ build: mainBuild.name, rel: true, ctx: true, dot: true, psx: true });
				apply(app.wpc.entry, {
					[ app.build.name ]: `${mainSrcPath}/${mainBuild.name}.js`
				});
			}
		}
		else {
			this.app.addWarning(WpwMessageEnum.WARNING_CONFIG_INVALID_EXPORTS, undefined, "module entry[jsdoc]");
		}
	}


	/**
	 * @override
	 */
	module()
	{
		const app = this.app,
			  srcPath = app.getSrcPath({ build: app.build.name, rel: true, ctx: true, dot: true, psx: true });
		apply(app.wpc.entry,
		{
			[app.build.name]: {
				import: `${srcPath}/${app.build.name}.ts`
			}
		});
		if (app.build.debug)
		{
			/** @type {typedefs.WpwWebpackEntryObject} */
			(app.wpc.entry[app.build.name]).layer = "release";
			apply(app.wpc.entry,
			{
				[`${app.build.name}.debug`]:
				{
					import: `${srcPath}/${app.build.name}.ts`,
					layer: "debug"
				}
			});
		}
	};


	/**
	 * @override
	 * @throws {WpBuildError}
	 */
	tests()
	{
		const app = this.app,
			  testsPath = app.getSrcPath({ build: app.build.name, stat: true });
		if (testsPath)
		{
			apply(app.wpc.entry, {
				...this.testRunner(testsPath),
				...this.testSuite(testsPath)
			});
		}
	}


	/**
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpwWebpackEntry}
	 */
	testRunner(testsPathAbs)
	{
		return glob.sync(
			"**/*.ts", {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true, ignore: [ this.globTestSuiteFiles ]
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = {
				import: `./${e}`
			};
			return obj;
		}, {});
	}


	/**
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpwWebpackEntry}
	 */
	testSuite(testsPathAbs)
	{
		return glob.sync(
			this.globTestSuiteFiles, {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = { import: `./${e}`, dependOn: "runTest" };
			return obj;
		}, {});
	}


	/**
	 * @override
	 */
	types()
	{
		const app = this.app,
			  build = app.build,
			  typesConfig = app.build.options.types;

		if (!typesConfig || typesConfig.mode !== "module") {
			return;
		}

		if (typesConfig.entry === "main")
		{
			const mainBuild = app.getBuild("module");
			if (mainBuild)
			{
				const mainSrcPath = app.getSrcPath({ build: mainBuild.name, rel: true, ctx: true, dot: true, psx: true });
				apply(app.wpc.entry, {
					[ build.name ]: `${mainSrcPath}/${mainBuild.name}.${app.source.ext}`
				});
			}
		}
		else if (typesConfig.entry === "index")
		{
			const typesPath = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
			apply(app.wpc.entry, {
				[ build.name ]: `${typesPath}/index.${app.source.ext}`
			});
		}
		else if (typesConfig.entry && existsSync(resolve(this.app.getContextPath(), typesConfig.entry)))
		{
			const chunk = this.fileNameStrip(typesConfig.entry, true).replace(/\\/g, "/").replace(/^.\//, "");
			apply(app.wpc.entry, {
				[ build.name ]: `./${chunk}.${app.source.ext}`
			});
		}
		else {
			this.app.addWarning(WpwMessageEnum.WARNING_CONFIG_INVALID_EXPORTS, undefined, "module entry[types]");
		}
	}


	/**
	 * @override
	 */
	webapp()
	{
		const app = this.app,
			  appPath = app.getSrcPath();
		if (isDirectory(appPath))
		{
			apply(app.wpc.entry, createEntryObjFromDir(appPath, ".ts"));
		}
		else
		{
			const relPath = relativePath(app.getContextPath(), appPath),
				  chunk = basename(relPath).replace(".ts", "");
			apply(app.wpc.entry, { [ chunk ]: `./${relPath}` });
		}
	}

}


module.exports = WpwEntryExport.build;
