// @ts-check

/**
 * @file src/exports/entry.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/entry-context/}
 *
 *//** */

const { glob } = require("glob");
const { basename, isAbsolute, normalize } = require("path");
const WpwWebpackExport = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { relativePath, forwardSlash, resolvePath } = require("../utils");
const { apply, isObjectEmpty, isString, isDirectory, isFunction, isObject } = require("@spmeesseman/type-utils");
const { existsSync, exists } = require("fs");


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
		let entryPathAbs;
		const build = this.build,
			  entry = build.entry;

		if (isString(entry)) // guaranteed to be a string, or undefined.  object type handled in create()
		{
			entryPathAbs = entry;
			if (!isAbsolute(entry)) {
				entryPathAbs = resolvePath(build.getContextPath(), entryPathAbs);
			}
			entryPathAbs = normalize(`${entryPathAbs.replace(/\.js$/, "")}.js`);
			if (!existsSync(entryPathAbs)) {
				entryPathAbs = undefined;
			}
		}

		if (!entryPathAbs && build.pkgJson.main)
		{
			entryPathAbs = build.pkgJson.main;
			if (!isAbsolute(entryPathAbs)) {
				entryPathAbs = resolvePath(build.getBasePath(), entryPathAbs);
			}
			entryPathAbs = normalize(`${entryPathAbs.replace(/\.js$/, "")}.js`);
			if (!existsSync(entryPathAbs)) {
				entryPathAbs = undefined;
			}
		}

		if (!entryPathAbs)
		{
			entryPathAbs = normalize(`${build.getSrcPath()}/${build.name}${build.source.dotext}`);
			if (!existsSync(entryPathAbs)) {
				entryPathAbs = undefined;
			}
		}

		if (!entryPathAbs)
		{
			build.addMessage({
				code: WpwError.Msg.ERROR_CONFIG_PROPERTY,
				message: "could not determine entry point",
				suggest: "set the 'entry' property in the wpw build configuration",
				detail: `build details: [name=${build.name}] [type=${build.type}] [mode=${build.mode}]`
			});
			return;
		}

		let entryPath = relativePath(build.getContextPath(), entryPathAbs);
		entryPath = `./${forwardSlash(entryPath.replace(/^\.\//, "").replace(/\.js$/, ""))}.js`;

		if (entryPathAbs.includes(build.getDistPath()))
		{
			build.addMessage({
				code: WpwError.Msg.ERROR_CONFIG_PROPERTY,
				message: "entry point cannot be a descendent of 'dist' path",
				suggest: "set a valid 'entry' property in the wpw build configuration",
				detail: `build details: [entry=${entryPath}] [name=${build.name}] [type=${build.type}] [mode=${build.mode}]`
			});
			return;
		}

		apply(build.wpc.entry, {
			[build.name]: { import: entryPath }
		});

		if (build.debug)
		{
			apply(build.wpc.entry, {
				[`${build.name}.debug`]: { import: entryPath, layer: "debug" }
			});
			const releaseEntry = /** @type {typedefs.IWpwWebpackEntryObject} */(build.wpc.entry[build.name]);
			releaseEntry.layer = "release";
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
		const _create = () =>
		{
			if (isFunction(this[build.type]))
			{
				this[build.type]();
			}
			else {
				this.build.addMessage({
					code: WpwError.Msg.ERROR_SHITTY_PROGRAMMER,
					message: `exports.entry.build[${build.type}]`
				});
				return;
			}
		};

		build.logger.start("create entry points", 1);

		if (isObject(build.entry)) // If the build rc defined `entry` itself, apply and we're done...
		{
			if (isObjectEmpty(build.entry))
			{
				build.addMessage({
					code: WpwError.Msg.WARNING_CONFIG_INVALID_EXPORTS,
					message: "entry target is invalid (empty object not allowed)"
				});
				_create();
			}
			else {
				build.logger.write("   rc defined entry point paths are not validted", 3);
				apply(build.wpc.entry, build.entry);
			}
		}
		else {
			_create();
		}

		build.logger.success("   create entry points", 2);
	}


	/**
	 * @override
	 */
	jsdoc()
	{
		const build = this.build,
			  jsdocConfig = build.options.jsdoc;
		if (jsdocConfig && jsdocConfig.mode === "plugin")
		{
			apply(build.wpc.entry, {
				[ build.name ]: `./${forwardSlash(this.virtualFileRelPath)}`
			});
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
	 * @returns {typedefs.IWpwWebpackEntryImport}
	 */
	testRunner(testsPathAbs)
	{
		return glob.sync(
			`**/*${this.build.source.dotext}`, {
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
	 * @returns {typedefs.IWpwWebpackEntryImport}
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
			apply(build.wpc.entry, {
				[ build.name ]: `./${forwardSlash(this.virtualFileRelPath)}`
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
			apply(build.wpc.entry, this.createEntryObjFromDir(appPath, build.source.dotext));
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
