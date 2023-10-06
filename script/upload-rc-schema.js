#!/usr/bin/env node
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @author Scott Meesseman @spmeesseman
 */


const { resolve } = require("path");
const WpwLogger = require("../src/utils/log");
const { execAsync } = require("../src/utils/utils");


//
// Run from script directtory so we work regardless of where cwd is set
//

/** @type {WpwLogger | undefined} */
let logger;

const localSourcePath = resolve(__dirname, "..", "schema");

const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
      user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
      rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
      sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
      sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
      version = require("../package.json").version;

//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };


cliWrap(async(argv) =>
{
    if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
    {
        throw new Error("Required environment variables for upload are not set");
    }

    const quiet = argv.includes("--quiet") || argv.includes("-q");
    if (!quiet) {
        const name = "script: upload schema definition files";
        logger = new WpwLogger({ name, envTag1: "wpwrap", envTag2: "upload", level: 5 });
    }

    const plinkCmds = [
        `mkdir ${rBasePath}/webpack-wrap`,
        `mkdir ${rBasePath}/webpack-wrap/v${version}`,
        `mkdir ${rBasePath}/webpack-wrap/v${version}/schema`,
        `mkdir ${rBasePath}/webpack-wrap/v${version}/schema/template`,
        `rm -f ${rBasePath}/webpack-wrap/v${version}/schema/spm.schema.*.json"`,
        `rm -f ${rBasePath}/webpack-wrap/v${version}/schema/template/*.*"`
    ];

    const plinkArgs = [
        "-ssh",       // force use of ssh protocol
        "-batch",     // disable all interactive prompts
        sshAuthFlag,  // auth flag
        sshAuth,      // auth key
        `${user}@${host}`,
        plinkCmds.join(";")
    ];

    const pscpArgs = [
        sshAuthFlag,     // auth flag
        sshAuth,         // auth key
        "-q",            // quiet, don't show statistics
        "-r",            // copy directories recursively
        localSourcePath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
        `${user}@${host}:"${rBasePath}/webpack-wrap/v${version}"` // uploaded, and created if not exists
    ];

    logger?.log(`   plink: create / clear remmote directory: ${rBasePath}/webpack-wrap/v${version}/schema`);
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..") },
        command: "plink " + plinkArgs.join(" ")
    });

    logger?.log(`   pscp: upload files from ${localSourcePath}`);
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..") },
        command: "pscp " + pscpArgs.join(" ")
    });

    if (logger) {
        logger.blank(undefined, logger.icons.color.success);
        logger.success("successfully uploaded rc schema", undefined, "", true);
        logger.blank(undefined, logger.icons.color.success);
    }
})(process.argv.slice(2));
