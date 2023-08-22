#!/usr/bin/env node

function cliWrapper (execute)
{
    return (argv) =>
    {
        execute(argv).catch((error) =>
        {
            try {
                console.error(error.message)
            } 
            catch (_) { }
            process.exit(1)
        })
    };
}

async function run ()
{
    const { argv, childArgs, yargs } = await configUtil()

    if (argv._.length === 0)
    {
        process.exitCode = 1
        yargs.showHelp()
        return
    }

    process.exitCode = 0
    foreground(childArgs, async () =>
    {
        const mainChildExitCode = process.exitCode
        try
        {
            console.log("TODO!!!");
        }
        catch (error) {
            process.exitCode = process.exitCode || mainChildExitCode || 1;
            console.error(error.message)
        }
    })
}

cliWrapper(run)()
