#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-nocheck

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

const RUN_VALIDATION = true;

const description = "Provides types macthing the .wpbuildrc.json configuration file schema";
const autoGenMessage = "This file was auto generated using the 'json-to-typescript' utility";

const classTypes = [
    "WpwRcSchema", "WpwSourceCode", "WpwBuild"
];

const excludeTypedefs = [
    "WpwBooleanReadOnly", "WpwBooleanDefaultFalse", "WpwBooleanDefaultTrue", "WpwBuildOptionsPluginKeyReadOnly"
];

const exclueConstants = [];

const generateEnums = [
    // "WpwMessage"
    "WpwSourceCodeTypescriptBuildMethod"
];

const constantObjectKeyProperties = [
    "WpwPackageJson", "WpwRcPaths", "WpwPluginConfigRunScripts", "WpwBuildOptions"
];

const extFilesCreateEnums = [
    // "message.d.ts"
];

const mapValueTypesAllowUndefined = [
    "WpwWebpackAliasValue", "WpwWebpackEntryValue"
];

/**
 * Types that will be auto populated/nonnullable at runtime, but are optional in json schema
 */
const requiredProperties = [
    [ "colors", "WpwLog" ],
    [ "*", "WpwMessage" ],
    [ "mode", "WpwBuild" ],
    [ "pad", "WpwLog" ],
    [ "default", "WpwLogColoring" ],
    [ "system", "WpwLogColoring" ],
    [ "level", "WpwLog" ],
    [ "source", "WpwBuild" ],
    [ "config", "WpwSourceCode" ],
    [ "log", "WpwBuild" ],
    [ "paths", "WpwBuild" ],
    [ "options", "WpwBuild" ],
    [ "target", "WpwBuild" ],
    [ "type", "WpwBuild" ],
    [ "base", "WpwRcPaths" ],
    [ "ctx", "WpwRcPaths" ],
    [ "dist", "WpwRcPaths" ],
    [ "src", "WpwRcPaths" ],
    [ "temp", "WpwRcPaths" ],
    [ "includeAbs", "WpwSourceCodeConfig" ],
    [ "excludeAbs", "WpwSourceCodeConfig" ],
    [ "options", "WpwSourceCodeConfig" ],
    [ "compilerOptions", "WpwSourceCodeConfigOptions" ],
    [ "files", "WpwSourceCodeConfigOptions" ],
    [ "scopedName", "WpwPackageJson" ],
    [ "ext", "WpwSourceCode" ]
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

/** @type {[ string, "type" | "enum", string ][]} */
const typedefs = [];

/** @type {WpBuildConsoleLogger} */
let logger;

// @ts-ignore
// String.prototype.wpwreplace = (/** @type {string} */ fn, /** @type {string} */ data) => replace[fn](data);
Object.defineProperty(String.prototype, "wpwreplace",
{   // eslint-disable-next-line object-shorthand
    value: function(/** @type {string} */ fn) { return wpwreplace[fn](this); }
});


//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */exe) =>
                (/** @type {string[]} */argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };

/**
 * @returns {Promise<string>}
 */
const parseTypesDts = async (/** @type {string} */hdr, /** @type {string} */data) =>
{
    logger.log("   parsing json2ts output");

    data = data
          .replace(/\r\n/g, "\n").replace(new RegExp(EOL,"g"), "\n")
          .wpwreplace("removeComments")
          .wpwreplace("removeOrFormatNumberedDupTypes")
          .wpwreplace("formatPackageJsonAuthor")
          .wpwreplace("formatWebpackEntry")
          .wpwreplace("formatInterface")
          .wpwreplace("formatType")
          .wpwreplace("replaceBooleanTypedefs")
          .wpwreplace("justifyInnerObjects")
          .wpwreplace("mappedTypeToAnyOrUndef")
          .wpwreplace("trailingSemiColons")
          .wpwreplace("trailingSpaces")
          .replace(/\n/g, EOL);

    await writeFile(outputDtsPath, `${EOL}${hdr}${EOL}${EOL}${EOL}${data.trim()}${EOL}`);
    logger.success(`   created ${outputDtsFile} (${outputDtsPath})`);
    return data;
};


/**
 * @returns {Promise<0|1>}
 */
const promptForRestore = async (/** @type {string} */file, /** @type {string} */previousContent) =>
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


const pushEnum = (/** @type {string} */property, /** @type {"enum" | "type" | "object"} */kind, /** @type {string} */value) =>
{
    if (generateEnums.includes(property))
    {
        let jsdoc;
        let valueFmt;
        const propertyName = property + "Enum";
        if (kind === "enum")
        {
            jsdoc = `/**\n * @enum {typedefs.${property}}\n * @type {{ [ key in typedefs.${property} ]: typedefs.${property} }}\n */`;
            valueFmt = value.replace(/\|? *"(.*?)"/g, (_, m) => `\n    ${m}: "${m}",`)
                            .replace(/",\n\}/g, "\n}").replace(/", +\n/g, "\",\n");
        }
        else if (kind === "object")
        {
            jsdoc = `/**\n * @enum {typedefs.${property}}\n * @type {{ [ key in typedefs.${property}Key ]: typedefs.${property}Key }}\n */`;
            valueFmt = value.replace(/\s*(.*?) = "/g, (_, m) => `\n    ${m}: "`)
                            .replace(/\= \n/g, "\n")
                            .replace(/";\n/g, "\",\n");
        }
        else {
            jsdoc = `/**\n * @enum {typedefs.${property}}\n * @type {{ [ key in typedefs.${property}Key ]: typedefs.${property}Key  }}\n */`;
            valueFmt = value.replace(/ *\= */, "")
                            .replace(/\s*(.*?)\??\: /g, (_, m) => `\n    ${m}: `)
                            .replace(/\= \n/g, "\n")
                            .replace(/";\n/g, "\",\n");
        }
        enums.push(
            `${jsdoc}\nconst ${propertyName} =\n{${(`${valueFmt}\n};\n`).replace(/"[,;]\},/g, "\"\n};\n").replace(/"[,;]\n\};/g, "\"\n};")}`
        );
        exported.push(`    ${propertyName}`);
        logger.log(`      added enum ${propertyName}`);
    }
};


/**
 * @returns {[ string, string ]}
 */
const pushExport = (/** @type {string} */property, /** @type {string} */suffix, /** @type {string} */values, /** @type {string} */valueType) =>
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
        ` * @returns {v is ${!valueType ? `typedefs.${property}` : `${valueType}`}}`,
        " */",
        `const is${pName2} = (v) => !!v && ${pName1}.includes(v);${EOL}`
    );
    let enumeration = enums.find(e => e.includes(`${property}Enum`));
    if (enumeration) {
        lines.push(enumeration);
        pushTypedef("constants", "type", `${property}Enum`);
        exported.push(`    ${property}Enum`);
    }
    else {
        enumeration = enums.find(e => e.includes(`const ${property} = `));
        if (enumeration) {
            lines.push(enumeration);
            pushTypedef("constants", "type", `${property}`);
            exported.push(`    ${property}`);
        }
    }
    logger.log(`      added runtime constants for type ${property}`);
    return [ pName1, `is${pName2}` ];
};


const pushTypedef = (/** @type {string} */source, /** @type {"enum" | "type"} */kind, /** @type {string[]} */...properties) =>
{
    const incProps = properties.filter(
        (p) => !excludeTypedefs.includes(p) && typedefs.every(t => t[0] !== source || !(t[1] === kind && t[2] === p))
    );
    typedefs.push(.../** @type {[string, "enum" | "type", string][]} */(incProps.map(p => [ source, kind, p ])));
    for (const property of incProps) {
        logger.log(`      added typedef for type ${property}`);
    }
};


/**
 * @type {Record<string, (data: string) => string>}
 */
const wpwreplace =
{
    formatInterface: (data) =>
    {
        return data.replace(
            /\nexport interface (.*?) ([^]*?)\n\}/g,
            (/** @type {string} */_v, /** @type {string} */m1, /** @type {string} */m2) =>
            {
                let src = `\nexport declare interface I${m1} ${m2}\n}`;
                logger.log(`      added interface I${m1}`);
                pushTypedef("rc", "type", `I${m1}`);
                pushEnum(m1, "type", m2);
                if (!classTypes.includes(m1))
                {
                    src += `\nexport declare type ${m1} = I${m1};\n` +
                        `export declare type ${m1}Key = keyof ${m1};\n`;
                        // `export declare type Type${m1} = Required<${m1}>;\n`;
                    pushTypedef("rc", "type", m1, `${m1}Key`);
                    pushEnum(m1, "type", m2);
                }
                requiredProperties.filter(([ _, t ]) => t === m1).forEach(([ p, _ ]) => {
                    src = src.replace(new RegExp(`${p !== "*" ? p : ""}\\?\\: `, "g"), `${p !== "*" ? p : ""}: `);
                });
                return src.replace(/\n\};?\n/g, "\n}\n");
            }
        );
    },
    formatPackageJsonAuthor: (data) =>
    {
        return data.replace(/author\?\:[^]*?(?:\}|\));/, "author?: string | { name: string; email?: string };");
    },
    formatType: (data) =>
    {
        return data.replace(
            /\nexport type (.*?) =/g, (v, m) =>
            {
                pushTypedef("rc", "type", m);
                return v.replace("export type", "export declare type");
            }
        )
        .replace(/([^\|]) \{\n    /g, (_, m) => m + "\n{\n    ")
        .replace(/\n    \| +(["0-9a-z])/g, (_, m) => " | " + m)
        .replace(/[a-z] = +\| +(?:"?[a-z]|[0-9])/g, (v) => v.replace("= |", "="))
        .replace("export declare type WpwLoggerLevel", "\nexport declare type WpwLoggerLevel");
    },
    formatWebpackEntry: (data) =>
    {
        return data.replace(
            /export type WebpackEntry =\s+\|(?:[^]*?)\};/g,
            (v) => v.replace("| string", "string").replace(/\n/g, " ").replace(/ {2,}/g, " ")
        );
    },
    justifyInnerObjects: (data) =>
    {
        return data.replace(/    ([a-z?]+?): *\n\{/g, (_, m) => "    " + m + ":\n    {")
                   .replace(/([a-z?]): +\n/g, (_, m) => m + ":\n")
                   .replace(/\: *\n\{\n {14}/g, ":\n          {\n              ")
                   .replace(/=\n {4,}\| ?[^]*?\n {6}\};\n/g, (v) => v.replace(/\n {2,}/g, " "))
                   .replace(/( +)\}\n( +)\{\n/g, (v, m1, m2) => `${m1}},\n${m2}\n}`);
    },
    mappedTypeToAnyOrUndef: (data) =>
    {
        return data.replace(/\[k\: string\]: (.*?);/g, (v, m) =>
        {
            if (mapValueTypesAllowUndefined.includes(m)) return`[k: string]: ${m} | undefined;`; return v;
        })
        .replace(/\]\: unknown;/g, "]: any;");
    },
    removeComments: (data) => data.replace(/\/\*\*(?:[^]*?)\*\//g, "").replace(/\/\* eslint\-disable \*\/$/gm, ""),
    removeOrFormatNumberedDupTypes: (data) =>
    {
        return data.replace(/\& (?:[A-Za-z]*?)1;\n/g, ";")
                   .replace(/export type (?:.*?)[0-9] = (?:.*?);\n\n/g, "")
                   .replace(/export type Wpw(?:.*?)[0-9] = (?:[^]*?)["a-z];\n\n/g, "");
    },
    replaceBooleanTypedefs: (data) =>
    {
        return data.replace(/    (.*?)\?\: WpwBooleanReadOnly;/g, (v, m) => `    readonly ${m}?: boolean;`)
                   .replace(/    (.*?)\?\: WpwBuildOptionsPluginKeyReadOnly;/g, (_, m) => `    readonly ${m}?: WpwBuildOptionsPluginKey;`)
                   .replace(/    (.*?)\?\: WpwBooleanDefaultTrue;/g, (v, m) => `    ${m}?: boolean;`)
                   .replace(/    (.*?)\?\: WpwBooleanDefaultFalse;/g, (v, m) => `    ${m}?: boolean;`)
                   .replace(/export declare type WpwBoolean(?:ReadOnly|DefaultTrue|DefaultFalse) = boolean;\n\n/g, "")
                   .replace(/export declare type WpwBuildOptionsPluginKeyReadOnly = boolean;\n\n/g, "");
    },
    trailingSemiColons: (data) => data.replace(/([;\{])\n\s*?\n(\s+)/g, (_, m1, m2) => m1 + "\n" + m2).replace(/; *\};/g, " };"),
    trailingSpaces: (data) => data.replace(/ +\n/g, "\n").replace(/[\w] ;/g, (v) => v.replace(" ;", ";"))
};


const writeConstantsJs = async (/** @type {string} */hdr, /** @type {string} */data) =>
{
    let match;
    logger.log("   create implementation constants");

    const _proc = (data, baseSrc) =>
    {
        const rgxPropEnum = /export declare type (\w*?) = ((?:"|WpwLogTrueColor).*?(?:"|));\r?\n/g,
              rgxType = new RegExp(`export declare interface I(${constantObjectKeyProperties.join("|")}) *${EOL}\\{\\s*([^]*?)${EOL}\\}${EOL}`, "g");

        while ((match = rgxPropEnum.exec(data)) !== null)
        {
            if (!exclueConstants.includes(match[1]) && !excludeTypedefs.includes(match[1]))
            {
                pushTypedef(baseSrc, "type", match[1]);
                properties.push(match[1]);
                if (match[2].includes("WpwLogTrueColor")) {
                    match[2] = match[2].replace("WpwLogTrueColor", "...WpwLogTrueColors");
                }
                pushTypedef("constants", "type", ...pushExport(match[1], "s", match[2]));
                pushEnum(match[1], "enum", match[2]);
            }
        }

        while ((match = rgxType.exec(data)) !== null)
        {
            if (!exclueConstants.includes(match[1]) && !excludeTypedefs.includes(match[1]))
            {
                pushTypedef(baseSrc, "type", match[1]);
                const valuesFmt = `"${match[2].replace(new RegExp(`[\\?]?\\:(.*?);(?:${EOL}    |$)`, "gm"), "\", \"")}"`
                                              .replace(/(?:, ""|"", )/g, "");
                pushTypedef("constants", "type", ...pushExport(match[1], "Keys", valuesFmt, `(keyof typedefs.${match[1]})`));
                pushEnum(match[1], "enum", match[2]);
            }
        }

        const rgx3 = /export declare type (\w*?) = (\w*?) \& (\w*?);\r?\n/g;
        while ((match = rgx3.exec(data)) !== null)
        {
            if (!exclueConstants.includes(match[1]) && !excludeTypedefs.includes(match[1])) {
                pushTypedef(baseSrc, "type", match[1]);
            }
        }
    };

    _proc(data, "rc");
    pushExport("WebpackMode", "s", '"development" | "none" | "production"');
    for (const addFile of extFilesCreateEnums)
    {
        const source = addFile.replace(".d.ts", "");
        const addData = (await readFile(join(outputDtsDir, addFile), "utf8")).replace(/\r\n/g, "\n").replace(/\n/g, EOL);
        _proc(addData, source);
        const rgxKeys = /export declare type (\w*?) = keyof (?:typeof |)(\w*?);\r?\n/g;
        while ((match = rgxKeys.exec(addData)) !== null)
        {
            if (!exclueConstants.includes(match[1]) && !excludeTypedefs.includes(match[1])) {
                pushTypedef(source, "type", match[1]);
            }
        }
    }

/*
    let hooks = Object.keys(webpack.Compiler["hooks"]).filter(h => !("tapPromise" in hooks[h]));
    pushExport("WebpackCompilerSyncHook", "Props", hooks.join(", "), "(keyof typedefs.WebpackCompilerSyncHook)");
    exported.push(...hooks);

    hooks = Object.keys(webpack.Compiler["hooks"]).filter(h => "tapPromise" in hooks[h]);
    pushExport("WebpackCompilerAsyncHook", "Props", hooks.join(", "), "(keyof typedefs.WebpackCompilerAsyncHook)");

    hooks = Object.keys(webpack.Compilation["hooks"]).filter(h => !("tapPromise" in hooks[h]));
    pushExport("WebpackCompilationSyncHook", "Props", hooks.join(", "), "(keyof typedefs.WebpackCompilationSyncHook)");
    exported.push(...hooks);

    hooks = Object.keys(webpack.Compilation["hooks"]).filter(h => "tapPromise" in hooks[h]);
    pushExport("WebpackCompilationAsyncHook", "Props", hooks.join(", "), "(keyof typedefs.WebpackCompilationAsyncHook)");
*/
    lines.push(...enums);

    if (lines.length > 0)
    {
        const constantsFile = "constants.js",
              constantsPath = join(outputDtsDir, constantsFile),
              constantsData = await readFile(constantsPath, "utf8");

        exported.sort((a, b) => a.localeCompare(b));
        hdr = hdr.replace(`@file types/${outputDtsFile}`, `@file types/${constantsFile}`);
        data = `/* eslint-disable no-unused-labels */${EOL}`;
        data += `/* eslint-disable @typescript-eslint/naming-convention */${EOL}`;
        data += `// @ts-check${EOL}${EOL}`;
        data += `${hdr}${EOL}${EOL}`;
        data += `const typedefs = require(\"../types/typedefs\");${EOL}${EOL}`;
        data += lines.join(EOL) + EOL;
        data += `${EOL}module.exports = {${EOL}${exported.join("," + EOL)}${EOL}};${EOL}`;
        data = data.replace("'json-to-typescript' utility", `'generate-rc-types' script and${EOL} * 'json-to-typescript' utility${EOL} *`);
        data = data.replace(/ \* the 'json\-to\-typescript' utility(?:[^]+?) \*\//, ` * the 'json-to-typescript' utility${EOL} *${EOL} */`);

        await writeFile(constantsPath, data);

        await writeTypedefsJs();

        if (RUN_VALIDATION !== false)
        {
            logger.write(`      validating ${constantsFile}`);
            const code = await execAsync({
                logger,
                logPad: "      ",
                program: "tsc",
                execOptions: { cwd: outputDtsDir },
                command: `npx tsc --moduleResolution node --target es2020 --noEmit --skipLibCheck --allowJs ./${constantsFile}`
            });

            if (code === 0) {
                logger.success(`   created ${constantsFile} (${constantsPath}) [tsc validated]`);
            }
            else {
                await promptForRestore(constantsPath, constantsData);
            }
        }
        else {
            logger.success(`   created ${constantsFile} (${constantsPath}) [no tsc validation]`);
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
        `/* START_RC_DEFS */\r\n${
        typedefs // .sort((a, b) => ((a[0].length + a[1].length) - (b[0].length + b[1].length) || a[1].localeCompare(b[1])))
        .map(e => [ e[0], e[1], e[2].trim() ])
        .map((e) =>
            `/** @typedef {${e[1] === "enum" ? "typeof " : ""}` +
            `import("./${e[0]}").${e[1] === "enum" ? e[2].replace("Type", "") : e[2]}} ${e[2]} */`
        )
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
    const match = data.match(/\/\*\*(?:[^]*?)\*\/\/\*\* \*\//);
    if (!match) {
        throw new Error("Could not read header from index file 'index.d.ts'");
    }

    data = await readFile(outputDtsPath, "utf8");
    const hdr =  match[0]
          .replace(" with `WpBuild`", " with `WpwRc`")
          .replace("@file types/index.d.ts", `@file types/${outputDtsFile}`)
          .replace("Scott Meesseman @spmeesseman", (v) => `${v}\n *\n * ${autoGenMessage}`)
          .replace("Collectively exports all Wpw types", description);;

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

    if (RUN_VALIDATION !== false)
    {
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
    }

    if (code === 0)
    {
        data = await readFile(outputDtsPath, "utf8");
        data = await parseTypesDts(hdr, data);
        await writeConstantsJs(hdr, data);
        await writeIndexJs();
    }

    logger.blank(undefined, logger.icons.color.success);
    const msg = RUN_VALIDATION !== false ? " [tsc validated]" : " [no tsc validation]";
    logger.success("types and typings created successfully" + msg, undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);

})();
