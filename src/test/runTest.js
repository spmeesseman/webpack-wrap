#!/usr/bin/env node

const process = require("process");

// eslint-disable-next-line no-process-env
process.env.testArgs = process.argv && process.argv.length > 2 ? process.argv.filter(a => !a.startsWith("-")).slice(2).toString() : "";
// eslint-disable-next-line no-process-env
process.env.devArg = (process.argv && process.argv.length > 2 && process.argv.filter(a => a === "--dev").length > 0) ? "TRUE" : "FALSE";
// eslint-disable-next-line no-process-env
process.env.prodTestArg = (process.argv && process.argv.length > 2 && process.argv.filter(a => a === "--prod-test").length > 0) ? "TRUE" : "FALSE";

require("./index")()
.then((exitCode) =>
{
    process.exitCode = exitCode;
})
.catch(() =>
{
    process.exitCode = 1;
});
