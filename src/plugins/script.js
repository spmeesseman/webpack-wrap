/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/jsdoc.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const { relative } = require("path");
const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { apply, isString, isArray, asArray, isDirectory } = require("@spmeesseman/type-utils");
const { existsAsync, findFiles } = require("../utils");


/**
 * @extends WpwBaseTaskPlugin
 */
class WpwScriptPlugin extends WpwBaseTaskPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(apply({ taskHandler: "executeScriptsBuild" }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"script">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwScriptPlugin | undefined}
     */
	static create = (build) => WpwScriptPlugin.wrap(this, build, "script");



    /**
     * @private
     * @param {typedefs.WpwPluginConfigRunScriptsItemDef} script
     * @returns {string}
     */
    buildCommand = (script) => `${script.type} ${script.path} ${script.args ? " " + script.args.join(" ") : ""}`;


    /**
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 * @returns {Promise<void>}
	 */
    async executeScriptsBuild(_assets)
    {
		this.logBuildInfo();

        let numFilesProcessed = 0;
        const build = this.build,
              logger = build.logger;
        //
        // Execute jsdoc command
        //
        const code = [];
        if (this.buildOptions.mode === "parallel")
        {
            code.push(...(await Promise.all(
                this.buildOptions.scripts.map(script => this.exec(this.buildCommand(script), "script"))
            )));
        }
        else {
            for (const script of this.buildOptions.scripts) {
                code.push(await this.exec(this.buildCommand(script), "script"));
            }
        }

        if (!code.every(c => c === 0 || c === null))
        {
            return build.addMessage({
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                compilation: this.compilation ,
                message: "scripts execution exited with error code " + code
            });
        }

        logger.write("   scripts execution successful", 2);

        if (this.buildOptions.output)
        {
            for (const path of asArray(this.buildOptions.output))
            {   //
                // Ensure output file or directory exists
                //
                if (!(await existsAsync(path)))
                {
                    build.addMessage({
                        code: WpwError.Code.ERROR_JSDOC_FAILED,
                        compilation: this.compilation,
                        message: "scripts build failed - output path doesn't exist",
                        detail: `configured output path: ${path}`
                    });
                    continue;
                }
                //
                // Process output files
                //
                logger.write("   start process output files", 2);
                const files = isDirectory(path) ? await findFiles("**/*.*", { cwd: path, absolute: true }) : [ path ];
                for (const filePath of files)
                {
                    const data = await readFile(filePath),
                        filePathRel = relative(path, filePath).replace(/^.*?[\\\/][0-9]+\.[0-9]+\.[0-9]+[\\\/]/, ""),
                        source = new this.compiler.webpack.sources.RawSource(data);

                    const info = /** @type {typedefs.WebpackAssetInfo} */({
                        immutable: true,
                        javascriptModule: false,
                        jsdoc: true
                    });

                    logger.value("      emit asset", filePathRel, 4);
                    this.compilation.emitAsset(filePathRel, source, info);
                    ++numFilesProcessed;
                }
                logger.write(`   successfully processed bold(${numFilesProcessed}) of ${files.length} output files`, 2);
            }
        }
        else {
            logger.write("   successfully processed script build (0 output files)", 2);
        }
    }


    logBuildInfo()
    {
        const logger = this.logger;
        logger.write("execute scripts build", 1);
		logger.value("   mode", this.buildOptions.mode, 1);
		logger.value("   # of scripts to execute", this.buildOptions.scripts.length, 1);
		logger.write("   scripts:", 2);
        this.buildOptions.scripts.forEach((script) => logger.write("      " + script, 2));
        if (isString(this.buildOptions.output)) {
		    logger.value("   output directory", this.buildOptions.output, 1);
        }
        else if (isArray(this.buildOptions.output)) {
            logger.write("   output paths:", 2);
            this.buildOptions.scripts.forEach((path) => logger.write("      " + path, 2));
        }
        else {
            logger.value("   output directory", "n/a", 1);
        }
    }

}


module.exports = WpwScriptPlugin.create;
