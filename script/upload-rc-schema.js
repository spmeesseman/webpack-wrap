#!/usr/bin/env node
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */


const { resolve } = require("path");
const { execAsync } = require("../src/utils/utils");
const WpBuildConsoleLogger = require("../src/utils/console");


//
// Run from script directtory so we work regardless of where cwd is set
//

/** @type {WpBuildConsoleLogger} */
let logger;

const remotePath = resolve(__dirname, "..", "schema");

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


cliWrap(async () =>
{
    if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
    {
        throw new Error("Required environment variables for upload are not set");
    }

    logger = new WpBuildConsoleLogger({
        envTag1: "wpbuild", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });
    logger.printBanner("generate-rc-types.js", "0.0.1", "generating rc configuration file type definitions");

    const plinkCmds = [
        `mkdir ${rBasePath}/wpbuild`,
        `mkdir ${rBasePath}/wpbuild/v${version}`,
        `mkdir ${rBasePath}/wpbuild/v${version}/schema`,
        `rm -f ${rBasePath}/wpbuild/v${version}/schema/.wpbuildrc.*.json"`
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
        sshAuthFlag,  // auth flag
        sshAuth,      // auth key
        "-q",         // quiet, don't show statistics
        "-r",         // copy directories recursively
        remotePath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
        `${user}@${host}:"${rBasePath}/wpbuild/v${version}"` // uploaded, and created if not exists
    ];

    logger.log("   plink: create / clear remmote directory");
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..") },
        command: "plink " + plinkArgs.join(" ")
    });
    logger.log("   pscp: upload files");
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..") },
        command: "pscp " + pscpArgs.join(" ")
    });

    logger.blank(undefined, logger.icons.color.success);
    logger.success("successfully uploaded rc schema", undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);
})();
