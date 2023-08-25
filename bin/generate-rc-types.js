#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { EOL } = require("os");
const { existsSync } = require("fs");
const { resolve, join, basename } = require("path");
const { execAsync } = require("../src/utils/utils");
const { readFile, writeFile } = require("fs/promises");
const WpBuildConsoleLogger = require("../src/utils/console");


const generateEnums = true;

const description = "Provides types macthing the .wpbuildrc.json configuration file schema";
const autoGenMessage = "This file was auto generated using the 'json-to-typescript' utility";

const excludeTypedefs = [
    "BooleanReadOnly"
];

/**
 * Types that will be auto populated/required at runtime, but are optional in json schema
 */
const requiredProperties = [
    [ "build", "WpBuildRcBuild" ],
    [ "colors", "WpBuildRcLog" ],
    [ "mode", "WpBuildRcBuild" ],
    [ "value", "WpBuildRcLogPad" ],
    [ "log", "WpBuildRc" ],
    [ "pad", "WpBuildRcLog" ],
    [ "default", "WpBuildRcLogColors" ],
    [ "system", "WpBuildRcLogColors" ],
    [ "level", "WpBuildRcLog" ],
    [ "entry", "WpBuildRcBuild" ],
    [ "alias", "WpBuildRcBuild" ],
    [ "source", "WpBuildRcBuild" ],
    [ "config", "WpwRcSourceCode" ],
    [ "log", "WpBuildRcBuild" ],
    [ "paths", "WpBuildRcBuild" ],
    [ "exports", "WpBuildRcBuild" ],
    [ "plugins", "WpBuildRcBuild" ],
    [ "target", "WpBuildRcBuild" ],
    [ "type", "WpBuildRcBuild" ],
    [ "base", "WpBuildRcPaths" ],
    [ "ctx", "WpBuildRcPaths" ],
    [ "dist", "WpBuildRcPaths" ],
    [ "src", "WpBuildRcPaths" ],
    [ "temp", "WpBuildRcPaths" ],
    [ "includeAbs", "WpwRcSourceCodeConfig" ],
    [ "excludeAbs", "WpwRcSourceCodeConfig" ],
    [ "options", "WpwRcSourceCodeConfig" ],
    [ "compilerOptions", "WpwRcSourceCodeConfigOptions" ]
];

const outputDtsFile = "rc.d.ts";
const outputDtsDir = resolve(__dirname, "..",  "src", "types");
const outputDtsPath = join(outputDtsDir, outputDtsFile);

/** @type {string[]} */
const enums = [];

/** @type {string[]} */
const exported = [];

/** @type {string[]} */
const properties = [];

/** @type {string[]} */
const lines = [];

/** @type {[ string, string ][]} */
const typedefs = [];

/** @type {WpBuildConsoleLogger} */
let logger;


//
// Run from script directtory so we work regardless of where cwd is set
//


//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };

/**
 * @param {string} type
 * @returns {boolean}
 */
const isBaseType = (type) => [
        "WpBuildRcExports", "WpBuildRcLog", "WpBuildRcLogPad", "WpBuildRcPaths", "WpBuildRcVsCode",
        "WpBuildRcPlugins", "WpBuildRcBuild", "WpBuildLogTrueColor", "WpBuildRcLogColors", "WpwRcSourceCode",
        "WpwRcSourceCodeConfig", "WpwRcSourceCodeConfigOptions"
    ].includes(type);


/**
 * @param {string} hdr
 * @param {string} data
 * @returns {Promise<string>}
 */
const parseTypesDts = async (hdr, data) =>
{
    logger.log("   parsing json2ts output");

    data = data
          .replace(/\r\n/g, "\n").replace(new RegExp(EOL,"g"), "\n")
          .replace(/\/\*\*(?:[^]*?)\*\//g, "")
          .replace(/\& (?:[A-Za-z]*?)1;\n/g, ";\n")
          .replace(/export type (?:.*?)1 = string;$/gm, "")
          // .replace(/\[[a-z]\: string\]\: string;$/gm, "")
          .replace("[k: string]: string;", "[k: string]: string | undefined;")
          .replace("export type WpBuildLogLevel1 = number;\n", "")
          .replace("export type WpBuildLogLevel = WpBuildLogLevel1 & WpBuildLogLevel2;\n", "")
          .replace("export type WpBuildLogLevel2 = 0 | 1 | 2 | 3 | 4 | 5;", "export type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;")
          .replace("export type WpBuildRcBuild = ", "export interface WpBuildRcBuild ")
          .replace(/\n\} +\& WpBuildRcBuild[0-9] *; *\n/g, "\n}\n")
          .replace(/export type WpBuildRcBuild[0-9](?:[^]*?)\};\n/, "")
          .replace(/\/\* eslint\-disable \*\/$/gm, "")
          .replace(/\n\}\nexport /g, "\n}\n\nexport ")
          .replace(/author\?\:[^]*?(?:\}|\));/, "author?: string | { name: string; email?: string };")
          .replace(/export type WebpackEntry =\s+\|(?:[^]*?)\};/g, (v) => v.replace("| string", "string").replace(/\n/g, " ").replace(/ {2,}/g, " "))
          .replace(/ *\$schema\?\: string;\n/, "")
          .replace(/(export type (?:.*?)\n)(export type)/g, (_, m1, m2) => `\n${m1}\n${m2}`)
          .replace(/(";\n)(export (?:type|interface))/g, (_, m1, m2) => `${m1}\n${m2}`)
          .replace(/\nexport interface (.*?) /g, (v, m1) =>
          {
                  if (isBaseType(m1))
                  {
                      return `\nexport declare type Type${m1} = `;
                  }
                  else if (m1 !== "WpBuildRcSchema") {
                      pushTypedef("rc", m1);
                      return `\nexport declare type ${m1} = `;
                  }
                  else {
                      pushTypedef("rc", m1);
                  }
                  return v;
          })
          .replace(/\nexport interface (.*?) ([^]*?)\n\}/g, (v, m1, m2) => {
              pushTypedef("rc", "I" + m1);
              return `export declare interface I${m1} ${m2}\n}\nexport declare type ${m1} = I${m1};\n`;
          })
          .replace(/\nexport declare type Type(.*?) ([^]*?)\n\}/g, (v, m1, m2) =>
          {
                  let src = v;
                  if (isBaseType(m1))
                  {
                      src = `export declare type ${m1} ${m2}\n};\n` +
                            `export declare type ${m1}Key = keyof ${m1};\n` +
                            `export declare type Type${m1} = Required<${m1}>;\n`;
                      requiredProperties.filter(([ _, t ]) => t === m1).forEach(([ p, _ ]) => {
                          src = src.replace(new RegExp(`${p}\\?\\: `, "g"), `${p}: `);
                      });
                      pushTypedef("rc", m1, `${m1}Key`, `Type${m1}`);
                      if (generateEnums)
                      {
                          const valuesFmt = m2.replace(/ *\= */, "")
                                              // .replace(/\s*(.*?)\??\:(?:.*?);(?:\n\}|\n {4,}|$)/g, (_, m1) => `\n    ${capitalize(m1)}: \"${m1.trim()}\",`)
                                              .replace(/\s*(.*?)\??\:(?:.*?);(?:\n\}|\n {4,}|$)/g, (_, m1) => `\n    ${m1}: \"${m1.trim()}\",`)
                                              .replace(/\= \n/g, "\n");
                          enums.push(
                              `/**\n * @type {{[ key: string ]: keyof typedefs.Type${m1}}}\n */\n` +
                              `const ${m1}Enum =${EOL}${(`${valuesFmt}\n};\n`).replace(/",\};/g, "\"\n};\n").replace(/",\n\};/g, "\"\n};")}`
                          );
                          logger.log(`      modified type ${m1} with enum`);
                      }
                      else {
                          logger.log(`      modified type ${m1}`);
                      }
                  }
                  else {
                      pushTypedef("rc", m1);
                  }
                  return src;
          })
          .replace(/\nexport type (.*?) =/g, (v, m) => {
              pushTypedef("rc", m);
              return v.replace("export type", "export declare type");
          })
          .replace(/([^\|]) \{\n    /g, (_, m) => m + " \n{\n    ")
          .replace(/\n    \| +(["0-9])/g, (_, m) => " | " + m)
          .replace(/(?:\n){3,}/g, "\n\n")
          .replace(/[a-z] = +\| +"[a-z]/g, (v) => v.replace("= |", "="))
          .replace(/[\w] ;/g, (v) => v.replace(" ;", ";"))
          .replace(/;\n\s+;\n/g, ";\n\n")
          .replace(/\n\};?\n/g, "\n}\n")
          .replace(/    (.*?)\?\: BooleanReadOnly;/g, (v, m) => `    readonly ${m}?: boolean;`)
          .replace("export declare type BooleanReadOnly = boolean;\n\n", "")
          .replace("WpBuildRcPluginsUser | WpBuildRcPluginsInternal", "WpBuildRcPluginsUser & WpBuildRcPluginsInternal")
          .replace(/(export declare type (?:[^]*?)\}\n)/g, v => v.slice(0, v.length - 1) + ";\n")
          .replace(/(export declare interface (?:[^]*?)\};\n)/g, v => v.slice(0, v.length - 2) + "\n\n")
          .replace(/([;\{])\n\s*?\n(\s+)/g, (_, m1, m2) => m1 + "\n" + m2)
          .replace(/ = \{ "= /g, "")
          .replace(/(=|[a-z]) \n\{ *\n/g, (_, m) => m + "\n\{\n")
          .replace(/\: \n\{\n {14}/g, ":\n          {\n              ")
          .replace(/=\n {4,}\| ?[^]*?\n {6}\};\n/g, (v) => v.replace(/\n {2,}/g, " "))
          // .replace(/export declare type WpBuildLogTrueColor =(?:.*?);\n/g, (v) => v + "\nexport declare type WpBuildLogTrueBaseColor = Omit<WpBuildLogTrueColor, \"system\">;\n")
          .replace(/"\}/g, "\"\n}")
          .replace(/\n/g, EOL);

    await writeFile(outputDtsPath, `${EOL}${hdr}${EOL}${EOL}${EOL}${data.trim()}${EOL}`);
    logger.success(`   created ${outputDtsFile} (${outputDtsPath})`);

    return data;
};


/**
 * @param {string} file
 * @param {string} previousContent
 * @returns {Promise<0|1>}
 */
const promptForRestore = async (file, previousContent) =>
{
    const promptSchema = {
        properties: {
            result: {
                description: "Restore previous content? : yes (y) or no (n)",
                pattern: /^(?:yes|no|y|n)$/i,
                default: "no",
                message: "Must enter yes (y) or no (n)",
                required: false
            }
        }
    };
    const prompt = require("prompt");
    prompt.start();
    const { result } = await prompt.get(promptSchema);
    if (result && result.toString().toLowerCase().startsWith("y"))
    {
        await writeFile(file, previousContent);
        logger.warning(`created ${basename(file)} but tsc validation failed, previous content has been restored`, "   ");
        return 1;
    }
    logger.warning(`created ${basename(file)} but tsc validation failed, new content was retained`, "   ");
    return 0;
};


/**
 * @param {string} property
 * @param {string} suffix
 * @param {string} values
 * @param {string} [valueType]
 * @returns {[ string, string ]}
 */
const pushExport = (property, suffix, values, valueType) =>
{
    const suffix2 = suffix.substring(0, suffix.length - 1),
          pName1 = `${property}${suffix}`,
          pName2 = `${property}${suffix2}`;
    exported.push(`    ${pName1}`, `    is${pName2}`);
    lines.push(
        "/**",
        ` * @type {${!valueType ? `typedefs.${property}[]` : `${valueType}[]`}}`,
        " */",
        `const ${pName1} = [ ${values.replace(/ \| /g, ", ")} ];${EOL}`,
        "/**",
        " * @param {any} v Variable to check type on",
        ` * @returns {v is typedefs.${property}}`,
        " */",
        `const is${pName2} = (v) => !!v && ${pName1}.includes(v);${EOL}`
    );
    const enumeration = enums.find(e => e.includes(`${property}Enum`));
    if (enumeration) {
        lines.push(enumeration);
        pushTypedef("constants", `${property}Enum`);
        exported.push(`    ${property}Enum`);
    }
    logger.log(`      added runtime constants for type ${property}`);
    return [ pName1, `is${pName2}` ];
};


/**
 * @param {string} source
 * @param {string[]} properties
 */
const pushTypedef = (source, ...properties) =>
{
    const incProps = properties.filter(
        (p) => !excludeTypedefs.includes(p) && typedefs.every(t => t[0] !== source || t[1] !== p)
    );
    typedefs.push(.../** @type {[string, string][]} */(incProps.map(p => [ source, p ])));
    for (const property of incProps) {
        logger.log(`      added typedef for type ${property}`);
    }
};


/**
 * @param {string} hdr
 * @param {string} data
 */
const writeConstantsJs = async (hdr, data) =>
{
    logger.log("   create implementation constants from new types");

    let match;
    const rgx = /export declare type (\w*?) = (".*?");\r?\n/g,
          rgx2 = new RegExp(`export declare type (WpBuildRcPackageJson|WpBuildRcPaths) = *${EOL}\\{\\s*([^]*?)${EOL}\\};${EOL}`, "g");

    pushExport("WebpackMode", "s", '"development" | "none" | "production"');

    while ((match = rgx.exec(data)) !== null)
    {
        pushTypedef("rc", match[1]);
        properties.push(match[1]);
        pushTypedef("constants", ...pushExport(match[1], "s", match[2]));
    }

    while ((match = rgx2.exec(data)) !== null)
    {
        pushTypedef("rc", match[1]);
        const propFmt = match[1].replace("Type", ""),
              valuesFmt = `"${match[2].replace(new RegExp(`[\\?]?\\:(.*?);(?:${EOL}    |$)`, "gm"), "\", \"")}"`
                                      .replace(/(?:, ""|"", )/g, "");
        pushTypedef("constants", ...pushExport(propFmt, "Props", valuesFmt, `(keyof typedefs.${propFmt})`));
    }

    const rgx3 = /export declare type (\w*?) = (\w*?) \& (\w*?);\r?\n/g;
    while ((match = rgx3.exec(data)) !== null)
    {
        pushTypedef("rc", match[1]);
    }

    if (lines.length > 0)
    {
        const constantsFile = "constants.js",
              constantsDir = resolve(__dirname, "..", "src", "types"),
              constantsPath = join(constantsDir, constantsFile),
              constantsData = await readFile(constantsPath, "utf8");

        exported.sort((a, b) => a.localeCompare(b));
        hdr = hdr.replace(`@file types/${outputDtsFile}`, `@file types/${constantsFile}`);
        data = `/* eslint-disable no-unused-labels */${EOL}// @ts-check${EOL}${EOL}${hdr}${EOL}${EOL}`;
        data += `const typedefs = require(\"../types/typedefs\");${EOL}${EOL}`;
        data += lines.join(EOL) + EOL;
        data += `${EOL}module.exports = {${EOL}${exported.join("," + EOL)}${EOL}};${EOL}`;
        data = data.replace("'json-to-typescript' utility", `'generate-wpbuild-types' script together with${EOL} * the 'json-to-typescript' utility`);
        data = data.replace(/ \* the 'json\-to\-typescript' utility(?:[^]+?) \*\//, ` * the 'json-to-typescript' utility${EOL} */`);

        await writeFile(constantsPath, data);

        await writeTypedefsJs();

        logger.write(`      validating ${constantsFile}`);
        const code = await execAsync({
            logger,
            logPad: "      ",
            program: "tsc",
            execOptions: { cwd: constantsDir },
            command: `npx tsc --target es2020 --noEmit --skipLibCheck --allowJs ./${constantsFile}`
        });

        if (code === 0) {
            logger.success(`   created ${constantsFile} (${constantsPath})`);
        }
        else {
            await promptForRestore(constantsPath, constantsData);
        }
    }
};


const writeIndexJs = async () =>
{
    const indexFile = "index.js",
          indexPath= resolve(__dirname, "..", "src", "utils", indexFile);
    let data = await readFile(indexPath, "utf8");
    data = data.replace(
        /\/\* START_RC_DEFS \*\/(?:.*?)\/\* END_RC_DEFS \*\//g,
        `/* START_RC_DEFS */ ${exported.sort((a, b) => a.localeCompare(b)).map(e => e.trim()).join(", ")} /* END_RC_DEFS */`
    );
    await writeFile(indexPath, data);
    logger.success(`   updated exports in src/utils/${indexFile} (${indexPath})`);
};


const writeTypedefsJs = async () =>
{
    const typesFile = "typedefs.js",
          typesPath= resolve(__dirname, "..", "src", "types", typesFile);
    let data = await readFile(typesPath, "utf8");
    data = data.replace(
        /\/\* START_RC_DEFS \*\/(?:[^]*?)\/\* END_RC_DEFS \*\//g,
        `/* START_RC_DEFS */\r\n${typedefs // .sort((a, b) => ((a[0].length + a[1].length) - (b[0].length + b[1].length) || a[1].localeCompare(b[1])))
                                          .map(e => [ e[0], e[1].trim() ])
                                          .map(e => `/** @typedef {import("./${e[0]}").${e[1]}} ${e[1]} */`)
                                          .sort((a, b) => (a.length - b.length || a.localeCompare(b)))
                                          .join("\r\n")}\r\n/* END_RC_DEFS */`
    );
    await writeFile(typesPath, data);
    logger.success(`   updated definitions in src/types/${typesFile} (${typesPath})`);
};


cliWrap(async () =>
{
    logger = new WpBuildConsoleLogger({
        envTag1: "wpwrap", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });
    logger.printBanner("generate-rc-types.js", "0.0.1", "generating rc configuration file type definitions");

    const inputFile = ".wpbuildrc.schema.json",
          schemaDir = resolve(__dirname, "..", "schema"),
          indexPath = resolve(__dirname, "..", "src", "types", "index.d.ts"),
          jsontotsFlags = "-f --unreachableDefinitions --style.tabWidth 4 --no-additionalProperties";

    let data = await readFile(indexPath, "utf8");
    const match = data.match(/\/\*\*(?:[^]*?)\*\//);
    if (!match) {
        throw new Error("Could not read header from index file 'index.d.ts'");
    }

    data = await readFile(outputDtsPath, "utf8");
    const hdr =  match[0]
          .replace(" with `WpBuild`", " with `WpBuildRc`")
          .replace("@file src/types/index.d.ts", `@file types/${outputDtsFile}`)
          .replace("@spmeesseman Scott Meesseman", (v) => `${v}\n *\n * ${autoGenMessage}`)
          .replace("Exports all types for this project", description);;

    logger.log("creating rc configuration file types and typings from schema");
    logger.log("   executing json2ts");

    let code = await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..", "schema") },
        command: `json2ts ${jsontotsFlags} -i ${inputFile} -o ${outputDtsPath} --cwd "${schemaDir}"`
    });

    if (code !== 0) {
        throw new Error("   json2ts exited with failure code");
    }
    else if (!existsSync(outputDtsPath)) {
        throw new Error(`Output file '${outputDtsFile}' does not exist`);
    }

    logger.write(`   validating ${outputDtsFile}`);
    code = await execAsync({
        logger,
        logPad: "   ",
        program: "tsc",
        execOptions: { cwd: outputDtsDir },
        command: `npx tsc --target es2020 --noEmit --skipLibCheck ./${outputDtsFile}`
    });

    if (code === 0) {
        logger.success(`   created ${outputDtsFile} (${outputDtsPath})`);
    }
    else {
        code = await promptForRestore(outputDtsPath, data);
    }

    if (code === 0)
    {
        data = await readFile(outputDtsPath, "utf8");
        data = await parseTypesDts(hdr, data);
        await writeConstantsJs(hdr, data);
        await writeIndexJs();
    }

    logger.blank(undefined, logger.icons.color.success);
    logger.success("types and typings created successfully", undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);

})();
