/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/upload.js
 * !!! This module uses 'plink' and 'pscp' from the PuTTY package: https://www.putty.org
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variables WPBUILD_APP1_SSH_AUTH_*
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const { WpwRegex } = require("../utils");
const { join, basename } = require("path");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { copyFile, rm, readdir, rename, mkdir } = require("fs/promises");


/**
 * @extends WpwPlugin
 */
class WpwUploadPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options); // apply(options, { globalCacheProps: [ "callCount", "readyCount" ] }));
        this.build.global.upload.callCount = 0;
        this.build.global.upload.readyCount = 0;
    }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            uploadDebugSupportFiles: {
                async: true,
                hook: "afterEmit",
                callback: this.debugSupportFiles.bind(this)
            },
            cleanup: {
                async: true,
                hook: "done",
                callback: this.cleanup.bind(this)
            }
        });
    }


    /**
     * @private
     * @param {typedefs.WebpackStats} _stats
     * @throws {WebpackError}
     */
    async cleanup(_stats)
    {
        const tmpUploadPath = join(this.build.paths.temp, this.build.mode);
        try
        {   if (existsSync(tmpUploadPath))
            {
                const tmpFiles = await readdir(tmpUploadPath);
                if (tmpFiles.length > 0)
                {
                    await rm(tmpUploadPath, { recursive: true, force: true });
                }
                this.build.logger.write("upload plugin cleanup completed");
        }   }
        catch (e) {
			this.build.addMessage({
                code: WpwError.Code.ERROR_GENERAL,
                compilation: this.compilation,
                error: e,
                message: "exception while cleaning upload-from path"
            });
        }
    };


    /**
     * @private
     * @param {typedefs.WebpackCompilation} compilation
     * @throws {WebpackError}
     */
    async debugSupportFiles(compilation)
    {   //
        // `The lBasePath` variable is a temp directory that we will create in the in
        // the OS/env temp dir.  We will move only files that have changed content there,
        // and perform only one upload when all builds have completed.
        //
        const build = this.build,
              logger = build.logger,
              toUploadPath = join(build.paths.temp, build.mode);

        if (!build.global.runtimeVars) {
            return;
        }

        logger.write("upload debug support files", 1);
        this.compilation = compilation;
        if (!existsSync(toUploadPath)) {
            await mkdir(toUploadPath);
        }

        for (const chunk of Array.from(compilation.chunks).filter(c => c.canBeInitial() && c.name && !WpwRegex.TestsChunk.test(c.name)))
        {
            for (const file of Array.from(chunk.files))
            {
                const asset = compilation.getAsset(file);
                if (asset && chunk.name && (build.global.runtimeVars.next[chunk.name] !== build.global.runtimeVars.current[chunk.name] || !build.global.runtimeVars.previous[chunk.name]))
                {
                    const distPath = this.build.getDistPath();
                    logger.value("   queue asset for upload", logger.tag(file), 2);
                    logger.value("      asset info", JSON.stringify(asset.info), 4);
                    await copyFile(join(distPath, file), join(toUploadPath, file));
                    if (asset.info.related?.sourceMap)
                    {
                        const sourceMapFile = asset.info.related.sourceMap.toString();
                        logger.value("   queue sourcemap for upload", logger.tag(sourceMapFile), 2);
                        if (build.mode === "production") {
                            logger.value("   remove production sourcemap from distribution", sourceMapFile, 3);
                            await rename(join(distPath, sourceMapFile), join(toUploadPath, sourceMapFile));
                        }
                        else {
                            await copyFile(join(distPath, sourceMapFile), join(toUploadPath, sourceMapFile));
                        }
                    }
                }
                else /* istanbul ignore else */if (asset) {
                    logger.value("   unchanged, skip asset upload", logger.tag(file), 2);
                }
                else {
                    logger.value("   unknown error, skip asset upload", logger.tag(file), 2);
                }
            }
        }
        const filesToUpload = await readdir(toUploadPath);
        if (filesToUpload.length === 0)
        {
            logger.write("no assets to upload", 1, "");
            return;
        }

        const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
              user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
              rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
              sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
              sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG;

        if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
        {
            this.build.addMessage({
                compilation: this.compilation,
                code: WpwError.Code.ERROR_CONFIG_INVALID,
                message: "Required environment variables for upload are not set"
            });
            return;
        }

        const name = build.pkgJson.scopedName.name;
        const plinkCmds = [
            `mkdir ${rBasePath}/${name}`,
            `mkdir ${rBasePath}/${name}/v${build.pkgJson.version}`,
            `mkdir ${rBasePath}/${name}/v${build.pkgJson.version}/${build.mode}`,
            `rm -f ${rBasePath}/${name}/v${build.pkgJson.version}/${build.mode}/*.*`
        ];
        if (build.mode === "production") { plinkCmds.pop(); }

        const plinkArgs = [
            "-ssh",       // force use of ssh protocol
            "-batch",     // disable all interactive prompts
            sshAuthFlag,  // auth flag
            sshAuth,      // auth key
            `${user}@${host}`,
            plinkCmds.join(";")
        ];

        const pscpArgs = [
            sshAuthFlag,  // auth flag
            sshAuth,      // auth key
            "-q",         // quiet, don't show statistics
            "-r",         // copy directories recursively
            toUploadPath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
            `${user}@${host}:"${rBasePath}/${name}/v${build.pkgJson.version}"` // uploaded, and created if not exists
        ];

        await copyFile(join(this.build.getBasePath(), "node_modules", "source-map", "lib", "mappings.wasm"), join(toUploadPath, "mappings.wasm"));

        logger.write(`   upload resource files to ${host}`, 1, "");
        try
        {
            logger.write("   plink: create / clear remmote directory", 1);
            let rc = await this.exec("plink " + plinkArgs.join(" "), "plink", [ "cannot create directory", "File exists" ]);
            if (rc === 0)
            {
                logger.write("   pscp:  upload files", 1, "");
                rc = await this.exec("pscp " + pscpArgs.join(" "), "pscp");
                if (rc === 0)
                {
                    filesToUpload.forEach((f) =>
                        logger.write(`   ${logger.icons.color.successTag} ${logger.withColor(`uploaded ${basename(f)}`, logger.colors.grey)}`, 1)
                    );
                    logger.write("successfully uploaded resource files", 1);
                }
            }
        }
        catch (e)
        {
            logger.error("error uploading resource files:");
            filesToUpload.forEach((f) =>
                logger.write(`   ${logger.icons.color.errorTag} ${logger.withColor(`upload ${basename(f)} failed`, logger.colors.grey)}`, 1)
            );
            logger.error(e);
        }
        finally {
            await rm(toUploadPath, { recursive: true, force: true });
        }
    }
}


/**
 * Returns a `WpBuildUploadPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpcrc.json by setting the `plugins.upload`
 * property to a boolean value of `true` or `false`
 * @param {typedefs.WpwBuild} build
 * @returns {WpwUploadPlugin | undefined} plugin instance
 */
const upload = (build) => build.options.upload?.enabled ? new WpwUploadPlugin({ build }) : undefined;


module.exports = upload;
