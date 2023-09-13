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
const { basename } = require("path");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const {
	apply, WpwError, isObjectEmpty, isString, isDirectory, relativePath, createEntryObjFromDir, isFunction
} = require("../utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwEntryExport extends WpwWebpackExport
{
	/** @type {string} @private */
	globTestSuiteFiles= "**/*.{test,tests,spec,specs}.ts";


    /**
     * @param {typedefs.WpwExportOptions} options
     */
	constructor(options) { super(options); }


	/**
	 * @override
	 */
	app()
	{
		const build = this.build,
			  srcPath = build.getSrcPath({ build: build.name, rel: true, ctx: true, dot: true, psx: true });
		apply(build.wpc.entry,
		{
			[build.name]: {
				import: `${srcPath}/${build.name}${build.source.dotext}`
			}
		});
		if (build.debug)
		{
			/** @type {typedefs.IWpwWebpackEntryObject} */
			(build.wpc.entry[build.name]).layer = "release";
			apply(build.wpc.entry,
			{
				[`${build.name}.debug`]:
				{
					import: `${srcPath}/${build.name}${build.source.dotext}`,
					layer: "debug"
				}
			});
		}
	};


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build }); e.create(); return e; };


	/**
	 * @override
     * @protected
	 * @throws {WpwError}
	 */
	create()
	{
		const build= this.build;
		build.logger.start("create entry points", 1);

		//
		// If the build rc defined `entry` itself, apply and we're done...
		//
		if (!isObjectEmpty(build.entry))
		{
			build.logger.write(`   add defined entry points for build '${build.name}' [ type: ${build.type} ]`, 2);
			apply(build.wpc.entry, build.entry);
		}
		else if (isFunction(this[build.type]))
		{
			build.logger.write(`   create entry points for build '${build.name}' [ type: ${build.type} ]`, 2);
			this[build.type]();
		}
		else {
			this.build.addMessage({ code: WpwError.Msg.ERROR_SHITTY_PROGRAMMER, message: `exports.entry.build[${build.type}]` });
		}

		//
		// Validate entry pont paths
		//
		const result = Object.values(build.wpc.entry).every((e) =>
		{
			if (!e || (!isString(e) && !e.import))
			{
				throw WpwError.getErrorProperty("entry", build.wpc, "entry target is invalid");
			}
			const ep = isString(e) ? e : e.import;
			if (!ep.startsWith("./"))
			{
				build.logger.warning(`entry target should contain a leading './' in path, found [${ep}]`, build.logger.level !== 0 ? "   " : "");
				return false;
			}
			return true;
		});

		if (result) {
			build.logger.success("create entry points", 2);
		}
		else {
			build.logger.write("entry points created, but with warnings", 2, "", build.logger.icons.color.warning);
		}
	}


	/**
	 * @override
	 */
	jsdoc()
	{
		const build = this.build,
			  jsdocOptions = build.options.jsdoc;
		if (jsdocOptions && jsdocOptions.type === "entry")
		{
			const mainBuild = build.getBuild("app"),
				jsdocSrcPath = build.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
			if (mainBuild && jsdocSrcPath)
			{
				const mainSrcPath = build.getSrcPath({ build: mainBuild.name, rel: true, ctx: true, dot: true, psx: true });
				apply(build.wpc.entry, {
					[ build.name ]: `${mainSrcPath}/${mainBuild.name}${build.source.dotext}`
				});
			}
		}
		else {
			this.build.addMessage({ code: WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS, message: "app entry[jsdoc]" });
		}
	}


	/**
	 * @override
	 * @throws {WpwError}
	 */
	tests()
	{
		const build = this.build,
			  testsPath = build.getSrcPath({ build: build.name, stat: true });
		if (testsPath)
		{
			apply(build.wpc.entry, {
				...this.testRunner(testsPath),
				...this.testSuite(testsPath)
			});
		}
	}


	/**
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.IWpwWebpackEntry}
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
			obj[e.replace(this.build.source.dotext, "")] = {
				import: `./${e}`
			};
			return obj;
		}, {});
	}


	/**
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.IWpwWebpackEntry}
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
		const build = this.build,
			  typesConfig = build.options.types;
		if (typesConfig && typesConfig.mode === "plugin")
		{
			const virtualRelPath = relativePath(build.getBasePath(), `${build.global.cacheDir}/${build.name}${build.source.dotext}`);
			apply(build.wpc.entry, {
				[ build.name ]: `./${virtualRelPath.replace(/\\/g, "/")}`
			});
		}
	}


	/**
	 * @override
	 */
	webapp()
	{
		const build = this.build,
			  appPath = build.getSrcPath();
		if (isDirectory(appPath))
		{
			apply(build.wpc.entry, createEntryObjFromDir(appPath, build.source.dotext));
		}
		else
		{
			const relPath = relativePath(build.getContextPath(), appPath),
				  chunk = basename(relPath).replace(build.source.dotext, "");
			apply(build.wpc.entry, { [ chunk ]: `./${relPath}` });
		}
	}

}


module.exports = WpwEntryExport.create;
