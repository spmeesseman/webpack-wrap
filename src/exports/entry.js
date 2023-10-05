// @ts-check

/**
 * @file src/exports/entry.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description @see {@link https://webpack.js.org/configuration/entry-context/}
 *
 *//** */

const { existsSync } = require("fs");
const WpwWebpackExport = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { basename, isAbsolute, normalize } = require("path");
const { relativePath, forwardSlash, resolvePath, findFilesSync } = require("../utils");
const { apply, isObjectEmpty, isString, isDirectory, isFunction, isObject } = require("@spmeesseman/type-utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwEntryExport extends WpwWebpackExport
{
	/**
	 * @private
	 * @type {string}
	 */
	globTestSuiteFiles= "**/*.{test,tests,spec,specs}";


    /**
     * @param {typedefs.WpwExportOptions} options
     */
	constructor(options) { super(options); }


	/**
     * @override
     */
	static create = WpwEntryExport.wrap.bind(this);


	/**
	 * @override
	 */
	app()
	{
		const build = this.build,
			  entryPath = this.appEntryPath();
		if (entryPath && !build.hasError)
		{
			apply(build.wpc.entry, { [build.name]: { import: entryPath }});
			if (build.debug)
			{
				apply(build.wpc.entry, { [`${build.name}.debug`]: { import: entryPath, layer: "debug" }});
				const releaseEntry = /** @type {typedefs.IWpwWebpackEntryObject} */(build.wpc.entry[build.name]);
				releaseEntry.layer = "release";
			}
		}
	};


	appEntryPath()
	{
		let entryPathAbs;
		const build = this.build,
			  entry = build.entry;

		if (isString(entry))
		{
			entryPathAbs = entry;
			if (!isAbsolute(entryPathAbs)) {
				entryPathAbs = resolvePath(build.getContextPath({ build: "app" }), entryPathAbs);
			}
			entryPathAbs = normalize(`${entryPathAbs.replace(/\.js$/, "")}.js`);
			if (!existsSync(entryPathAbs)) {
				entryPathAbs = undefined;
			}
		}
		else if (isObject(build.entry))
		{
			const ePath = Object.values(build.entry)[0];
			if (isString(ePath)) {
				entryPathAbs = ePath;
			}
			else {
				entryPathAbs = ePath?.import;
			}
			if (entryPathAbs)
			{
				if (!isAbsolute(entryPathAbs)) {
					entryPathAbs = resolvePath(build.getContextPath({ build: "app" }), entryPathAbs);
				}
				if (!existsSync(entryPathAbs)) {
					entryPathAbs = undefined;
				}
			}
		}

		if (!entryPathAbs)
		{
			const mainBuildConfig = build.getBuildConfig("app");
			if (mainBuildConfig)
			{
				if (mainBuildConfig.entry)
				{
					if (isString(mainBuildConfig.entry)) {
						entryPathAbs = mainBuildConfig.entry;
					}
					else if (isObject(mainBuildConfig.entry))
					{
						const ePath = Object.values(mainBuildConfig.entry)[0];
						if (isString(ePath)) {
							entryPathAbs = ePath;
						}
						else {
							entryPathAbs = ePath?.import;
						}
					}
					if (entryPathAbs) {
						if (!isAbsolute(entryPathAbs)) {
							entryPathAbs = resolvePath(build.getBasePath({ build: "app" }), entryPathAbs);
						}
					}
				}
				if (!entryPathAbs || !existsSync(entryPathAbs))
				{
					entryPathAbs = normalize(`${mainBuildConfig.paths.src}/${mainBuildConfig.name}.${build.source.ext}`);
					if (!existsSync(entryPathAbs))
					{
						entryPathAbs = findFilesSync(
							`**/${mainBuildConfig.name}.${build.source.ext}`,
							{ cwd: mainBuildConfig.paths.src, absolute: true, maxDepth: 3 }
						)[0];
						if (!entryPathAbs || !existsSync(entryPathAbs)) {
							entryPathAbs = undefined;
						}
					}
				}
			}

			if (!entryPathAbs && build.pkgJson.main)
			{
				entryPathAbs = build.pkgJson.main;
				if (!isAbsolute(entryPathAbs)) {
					entryPathAbs = resolvePath(build.getBasePath({ build: "app" }), entryPathAbs);
				}
				entryPathAbs = normalize(`${entryPathAbs.replace(/\.js$/, "")}.js`);
				if (!existsSync(entryPathAbs)) {
					entryPathAbs = undefined;
				}
			}
		}

		if (!entryPathAbs)
		{
			return build.addMessage({
				code: WpwError.Code.ERROR_CONFIG_PROPERTY,
				message: "could not determine entry point",
				suggest: "set the 'entry' property in the wpw build configuration",
				detail: `build details: [wpc.entry: name=${build.name}] [type=${build.type}] [mode=${build.mode}]`
			});
		}

		let entryPath = relativePath(build.getContextPath(), entryPathAbs);
		entryPath = `./${forwardSlash(entryPath.replace(/^\.\//, "").replace(/\.js$/, ""))}.js`;

		if (entryPathAbs.includes(build.getDistPath()))
		{
			return build.addMessage({
				code: WpwError.Code.ERROR_CONFIG_PROPERTY,
				message: "entry point cannot be a descendent of 'dist' path",
				suggest: "set a valid 'entry' property in the wpw build configuration",
				detail: `build details: [entry=${entryPath}] [name=${build.name}] [type=${build.type}] [mode=${build.mode}]`
			});
		}

		return entryPath;
	}


	/**
	 * @override
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
					code: WpwError.Code.ERROR_SHITTY_PROGRAMMER,
					message: `no matching handler for build type [${build.type}]`
				});
				return;
			}
		};

		build.logger.start("create entry points", 1);

		if (isObject(build.entry) && build.type !== "jsdoc" && build.type !== "script" && build.type !== "types")
		{
			if (isObjectEmpty(build.entry))
			{
				build.addMessage({
					code: WpwError.Code.WARNING_CONFIG_INVALID_EXPORTS,
					message: "entry target is invalid (empty object not allowed)"
				});
				_create();
			}
			else {
				build.logger.write("   rc defined entry point paths are not validated", 3);
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
	jsdoc() { this.task(this.build.options.jsdoc); }


	/**
	 * @override
	 * @throws {WpwError}
	 */
	script() { this.task(this.build.options.script, true); }


	/**
	 * @private
	 * @param {typedefs.WpwBuildOptionsConfig<any>} config
	 * @param {boolean | undefined} [noEntry]
	 */
	task(config, noEntry)
	{
		const build = this.build;
		if (config && config.enabled !== false)
		{
			if (!noEntry)
			{
				const entry = build.entry || this.appEntryPath();
				if (isObject(entry))
				{
					let entryNum = 0;
					build.logger.write("   apply dependency entry point path for file dependencies", 3);
					apply(build.wpc.entry, entry);
					Object.values(build.entry).forEach((value) => {
						apply(build.wpc.entry, { [`entry${++entryNum}`]: value });
					});
				}
				else if (isString(entry)) {
					apply(build.wpc.entry, { entry1: `./${forwardSlash(entry)}` });
				}
			}
			apply(build.wpc.entry, { [build.name]: `./${forwardSlash(this.virtualFileRelPath)}`});
		}
	}


	/**
	 * @override
	 */
	tests()
	{
		const dotext = this.build.source.dotext;
		const testsPath = this.build.getSrcPath();
		apply(this.build.wpc.entry, {
			...this.createEntryObjFromDir(testsPath, dotext, true, [ this.globTestSuiteFiles + dotext ]),
			...this.createEntryObjFromDir(testsPath, dotext, true)
		});
	}


	/**
	 * @override
	 */
	types()
	{
		if (this.build.options.types?.mode === "plugin") { this.task(this.build.options.types); }
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
