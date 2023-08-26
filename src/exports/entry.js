// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/entry-context/}
 *
 */

const { glob } = require("glob");
const { existsSync } = require("fs");
const typedefs = require("../types/typedefs");
const { apply, WpBuildError, merge, isObjectEmpty, isString, WpBuildApp } = require("../utils");


const globTestSuiteFiles= "**/*.{test,tests,spec,specs}.ts";


const builds =
{
	/**
	 * @function
	 * @private
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
			/** @type {typedefs.WpBuildWebpackEntryObject} */
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
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @throws {WpBuildError}
	 */
	tests: (app) =>
	{
		const testsPath = app.getSrcPath({ build: app.build.name, stat: true });
		if (testsPath)
		{
			app.wpc.entry = {};
			apply(app.wpc.entry, {
				...builds.testRunner(testsPath),
				...builds.testSuite(testsPath)
			});
			// if (app.hasTypes())
			// {
			// 	if (!app.isSingleBuild || !existsSync(app.getDistPath({ build: "types" })))
			// 	{
			// 		const typesBuild= app.getAppBuild("types");
			// 		if (!typesBuild)  {
			// 			throw WpBuildError.getErrorProperty("types entry", "exports/entry.js", app.wpc);
			// 		}
			// 		Object.values(app.wpc.entry).forEach((e) =>
			// 		{
			// 			if (!isString(e)) {
			// 				e.dependOn = typesBuild.name;
			// 			}
			// 		});
			// 		builds.typesWrap(typesBuild, app);
			// 	}
			// }
		}
	},


	/**
	 * @function
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpBuildWebpackEntry}
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
	 * @function
	 * @private
	 * @param {string} testsPathAbs
	 * @returns {typedefs.WpBuildWebpackEntry}
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
	 * @function
	 * @private
	 * @param {typedefs.WpBuildRcBuild} build
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	typesWrap: (build, app) =>
	{
		const mainBuild = app.getAppBuild("module"),
			  typesPath = app.getSrcPath({ build: build.name, rel: true, ctx: true, dot: true, psx: true });
		if (mainBuild && typesPath)
		{
			const mainSrcPath = app.getSrcPath({ build: mainBuild.name, rel: true, ctx: true, dot: true, psx: true });
			// apply(app.wpc.entry, {
			// 	[ app.build.name ]: `${typesPath}/${app.build.name}.ts`
			// });
			apply(app.wpc.entry, {
				[ app.build.name ]: `${mainSrcPath}/${mainBuild.name}.ts`
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	types: (app) => { builds.typesWrap(app.build, app); }


	// /**
	//  * @function
	//  * @private
	//  * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	//  */
	// webapp: (app) =>
	// {
	// 	app.wpc.entry = apply({}, app.vscode.webview.apps);
	// }

};


// /**
//  * @function
//  * @private
//  * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
//  * @param {string} file
//  * @param {Partial<typedefs.EntryObject|typedefs.WpBuildWebpackEntry>} xOpts
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
// 		/** @type {typedefs.WpBuildWebpackEntryObject} */
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

	if (!isObjectEmpty(app.build.entry))
	{
		app.logger.write(`   create entry points by configuration rc for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
		merge(app.wpc.entry, app.build.entry);
	}
	else if (builds[app.build.type || app.build.name])
	{
		app.logger.write(`   create entry points for build '${app.build.name}' [ type: ${app.build.type} ]`, 2);
		builds[app.build.type || app.build.name](app);
	}
	else {
		 throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc);
	}

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
