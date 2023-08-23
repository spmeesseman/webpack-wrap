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

let localPath = ".wpbuildrc.schema.json",
    remotePath = resolve(__dirname, "..", "schema", ".wpbuildrc.schema.json");

const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
      user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
      rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
      sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
      sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
      version = require("../package.json").version,
      args = process.argv.splice(2);

if (args.length === 1)
{
    remotePath = args[0];
}
else if (args.length > 1)
{
    args.forEach((v, i, a) =>
    {
        if (v.startsWith("-"))
        {
            switch(v.replace(/^\-\-?/, ""))
            {
                case "i":
                    localPath = args[i + 1];
                    break;
                case "o":
                    remotePath = args[i + 1];
                    break;
            }
        }
    });
}


//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };


cliWrap(async () =>
{
    if (!localPath || !remotePath)
    {
        throw new Error("Invalid input or output path");
    }
    else if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
    {
        throw new Error("Required environment variables for upload are not set");
    }

    logger = new WpBuildConsoleLogger({
        envTag1: "wpbuild", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });
    logger.printBanner("generate-rc-types.js", "0.0.1", `generating rc configuration file type definitions`);

    const plinkCmds = [
        `mkdir ${rBasePath}/wpbuild`,
        `mkdir ${rBasePath}/wpbuild/v${version}`,
        `rm -f ${rBasePath}/wpbuild/v${version}/.wpbuildrc.schema.json"`
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
        remotePath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
        `${user}@${host}:"${rBasePath}/wpbuild/v${version}/.wpbuildrc.schema.json"` // uploaded, and created if not exists
    ];

    logger.log("   plink: create / clear remmote directory");
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..", "schema") },
        command: "plink " + plinkArgs.join(" ")
    });
    logger.log("   pscp: upload files");
    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..", "schema") },
        command: "pscp " + pscpArgs.join(" ")
    });

    logger.blank(undefined, logger.icons.color.success);
    logger.success("successfully uploaded rc schema", undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);
})();
