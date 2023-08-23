#!/usr/bin/env node
/* eslint-disable prefer-arrow/prefer-arrow-functions */
// @ts-check

const { resolve } = require("path");
const gradient = require("gradient-string");
const { execAsync } = require("../src/utils/utils");
const { wpwCliOptions } = require("../src/core/cli");
const { parseArgs, displayHelp } = require("@spmeesseman/arg-parser");



//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(process.argv.slice(2)).catch(e => { try { console.error(e); } catch {} process.exit(1); });
                };

const parserOpts = {
    enforceConstraints: false,
    ignorePositional: [ "-p", "--profile" ]
};
const options = parseArgs(wpwCliOptions, parserOpts);

for (const o in options)
{
}

//
// If user specified '-h' or --help', then just display help and exit
//
if (options.help)
{
    const title =
`----------------------------------------------------------------------------
Detailed Help
----------------------------------------------------------------------------
`;
    process.stdout.write(gradient("cyan", "pink").multiline(title, {interpolation: "hsv"}));
    displayHelp(wpwCliOptions);
    process.exit(0);
}

//
// If user specified '--version', then just display version and exit
//
if (options.version)
{
    const title =
`----------------------------------------------------------------------------
WpWrap Version :  ${require("../package.json").version}
----------------------------------------------------------------------------
`;
    process.stdout.write(gradient("cyan", "pink").multiline(title, {interpolation: "hsv"}));
    process.exit(0);
}

cliWrap((argv) => execAsync({
    command: `npx webpack ${argv.join(" ").replace(/(?:\-\-config|\-c) .*?\.js/, "")} --config ${resolve(__dirname, "..", "webpack.config.js")}`
}))();
