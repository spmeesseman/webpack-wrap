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
const WpwBase = require("../core/base");
const typedefs = require("../types/typedefs");
const {
	apply, WpBuildError, isObjectEmpty, isString, WpBuildApp, isDirectory, relativePath, createEntryObjFromDir
} = require("../utils");


const globTestSuiteFiles= "**/*.{test,tests,spec,specs}.ts";


const builds =
{
	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
     * @throws {WpBuildError}
	 */
	jsdoc: (app) =>
	{
		const jsdocOptions = WpwBase.getOptionsConfig("jsdoc", app.build.options);
		if (jsdocOptions.type === "entry")
		{
			const mainBuild = app.getAppBuild("module"),
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
			throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc, "build not configured for jsdoc 'entry' type");
		}
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	module: (app) =>
	{
		const srcPath = app.getSrcPath({ build: app.build.name, rel: true, ctx: true, dot: true, psx: true });
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
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @throws {WpBuildError}
	 */
	tests: (app) =>
	{
		const testsPath = app.getSrcPath({ build: app.build.name, stat: true });
		if (testsPath)
		{
			apply(app.wpc.entry, {
				...builds.testRunner(testsPath),
				...builds.testSuite(testsPath)
			});
		}
	},


	/**
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpwWebpackEntry}
	 */
	testRunner: (testsPathAbs) =>
	{
		return glob.sync(
			"**/*.ts", {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true, ignore: [ globTestSuiteFiles ]
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = {
				import: `./${e}`
			};
			return obj;
		}, {});
	},


	/**
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpwWebpackEntry}
	 */
	testSuite: (testsPathAbs) =>
	{
		return glob.sync(
			globTestSuiteFiles, {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = { import: `./${e}`, dependOn: "runTest" };
			return obj;
		}, {});
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	types: (app) =>
	{
		const build = app.build,
			  typesConfig = WpwBase.getOptionsConfig("types", app.build.options);

		if (!typesConfig || typesConfig.mode !== "module") {
			return;
		}

		if (typesConfig.entry === "main")
		{
			const mainBuild = app.getAppBuild("module");
			if (mainBuild)
			{
				const mainSrcPath = app.getSrcPath({ build: mainBuild.name, rel: true, ctx: true, dot: true, psx: true });
				apply(app.wpc.entry, {
					[ build.name ]: `${mainSrcPath}/${mainBuild.name}.ts`
				});
			}
		}
		else
		{
			const typesPath = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
			apply(app.wpc.entry, {
				index: `${typesPath}/index.ts`
			});
		}
	},


	/**
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	webapp: (app) =>
	{
		const appPath = app.getSrcPath();
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

};


// /**
//  * @function
//  * @private
//  * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
//  * @param {string} file
//  * @param {Partial<typedefs.EntryObject|typedefs.WpwWebpackEntry>} xOpts
//  * @throws {WpBuildError}
//  */
// const addEntry = (app, file, xOpts) =>
// {
// 	const ext = extname(file),
// 		  chunkName = basename(file).replace(new RegExp(`${ext}$`), "");
//
// 	let relPath = (!isAbsolute(file) ? file : relative(app.wpc.context, file)).replace(/\\/g, "/");
// 	if (!relPath.startsWith("./")) {
// 		relPath = "./" + relPath;
// 	}
//
// 	apply(app.wpc.entry,
// 	{
// 		[chunkName]: {
// 			import: `${relPath}/${chunkName}.${ext}`
// 		}
// 	});
//
// 	if (app.build.debug)
// 	{
// 		/** @type {typedefs.WpwWebpackEntryObject} */
// 		(app.wpc.entry[chunkName]).layer = "release";
// 		apply(app.wpc.entry,
// 		{
// 			[`${chunkName}.debug`]:
// 			{
// 				import: `${relPath}/${chunkName}.${ext}`,
// 				layer: "debug"
// 			}
// 		});
// 	}
// };


/**
 * Configures `webpackconfig.exports.entry`
 * @see {@link https://webpack.js.org/configuration/entry-context/}
 *
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @throws {WpBuildError}
 */
const entry = (app) =>
{
	app.logger.start("create entry points", 2);

	//
	// If the build rc defined `entry` itself, apply and we're done...
	//
	if (!isObjectEmpty(app.build.entry))
	{
		app.logger.write(`   add defined entry points for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
		apply(app.wpc.entry, app.build.entry);
	}
	//
	// Auto-create entry points based on build type
	//
	else if (builds[app.build.type])
	{
		app.logger.write(`   create entry points for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
		builds[app.build.type ](app);
	}
	//
	// Error state
	//
	else { throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc); }

	//
	// Validate entry pont paths
	//
	const result = Object.values(app.wpc.entry).every((e) =>
	{
		if (!e || (!isString(e) && !e.import))
		{
			throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc, "entry target is invalid");
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
		app.logger.write("   entry points created successfully", 2);
	}
	else {
		app.logger.write("   entry points created, but with warnings", 2);
	}
};


module.exports = entry;
