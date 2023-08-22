#!/usr/bin/env node
/* eslint-disable prefer-arrow/prefer-arrow-functions */

//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };

async function run ()
{
    const { argv, childArgs, yargs } = await configUtil();

    if (argv._.length === 0)
    {
        process.exitCode = 1;
        yargs.showHelp();
        return;
    }

    process.exitCode = 0;
    foreground(childArgs, async () =>
    {
        const mainChildExitCode = process.exitCode;
        try
        {
            console.log("TODO!!!");
        }
        catch (error) {
            process.exitCode = process.exitCode || mainChildExitCode || 1;
            console.error(error.message);
        }
    });
}

cliWrap(run)();
