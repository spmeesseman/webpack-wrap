// @ts-check

/**
 * @file src/plugins/script.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const { relative } = require("path");
const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { apply, isString, isArray, asArray, isDirectory } = require("@spmeesseman/type-utils");
const { existsAsync, findFiles, relativePath, resolvePath } = require("../utils");


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
		this.logScriptOptions();
        const build = this.build,
              logger = build.logger,
              scripts = this.buildOptions.scripts;
        //
        // Execute scripts
        //
        const codes = [];
        if (this.buildOptions.mode === "parallel")
        {
            codes.push(...(await Promise.all(
                scripts.map(script => this.exec(this.buildCommand(script), "script"))
            )));
        }
        else {
            for (const script of scripts) {
                codes.push(await this.exec(this.buildCommand(script), "script"));
            }
        }

        //
        // Check success on all script executions
        //
        if (!codes.every(c => c === 0)) {
            logger.write("   one or more script executions failed, check log output for details", 1);
            return;
        }
        logger.write("   scripts execution successful", 1);

        //
        // Process output files
        //
        for (const path of asArray(this.buildOptions.output))
        {   //
            // Ensure output file or directory exists
            //
            if (!(await existsAsync(path)))
            {
                build.addMessage({
                    code: WpwError.Code.ERROR_SCRIPT_FAILED,
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
            const files = isDirectory(path) ? await findFiles("**/*.*", { cwd: path, absolute: true }) :
                                              [ resolvePath(build.getContextPath(), path) ];
            for (const file of files)
            {
                const data = await readFile(file),
                      filePathRel = relativePath(path, file, { psx: true }), // .replace(/^.*?[\\\/][0-9]+\.[0-9]+\.[0-9]+[\\\/]/, ""),
                      source = new this.compiler.webpack.sources.RawSource(data);
                const info = /** @type {typedefs.WebpackAssetInfo} */(
                {
                    immutable: true,
                    javascriptModule: false,
                    script: true
                });
                logger.value("      emit asset", filePathRel, 4);
                this.compilation.emitAsset(filePathRel, source, info);
            }
            logger.write(`   successfully processed bold(${files.length}) output files`, 2);
        }
    }


    logScriptOptions()
    {
        this.logOptions("script", true, false);
		this.logger.write("   script commands:", 2);
        this.buildOptions.scripts.forEach((script) => {
            this.logger.write(`      ${script.type} ${script.path}${script.args ? " " + script.args.join(" ") : ""}`, 2);
        });
    }

}


module.exports = WpwScriptPlugin.create;
