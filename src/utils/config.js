// @ts-check

const { cosmiconfigSync } = require("cosmiconfig");
const { pickBy, isNulled } = require("@spmeesseman/type-utils");


/**
 * @param {string} cwd
 * @param {string | undefined} [cfgName]
 * @returns {Promise<any>}
 */
const getConfig = (cwd, cfgName) =>
{
    const configName = "wpwrc" + (!cfgName ? "" : `.${cfgName}`);
    const configFiles = [
        "package.json",
        `.${configName}`,
        `.${configName}.json`,
        `.${configName}.yaml`,
        `.${configName}.yml`,
        `.${configName}.js`
    ];

    const { config, filepath } = (
        cosmiconfigSync(configName, { searchPlaces: configFiles }).search(cwd)
    ) || { config: {}, filepath: "" };

    //
    // Merge config file options and CLI/API options
    //
    if (config.ci === false) { config.noCi = true; }

    config.configFilePath = filepath;

    //
    // Set default options values if not defined yet
    //
    const options = {
        // branch: "main",
        // repo: isString(pkgJson.repository) ? pkgJson.repository : pkgJson.repository?.url,
        // repoType: isObject(pkgJson.repository) ? pkgJson.repository?.type : "git",
        // eslint-disable-next-line no-template-curly-in-string
        // tagFormat: "v${version}",
        // Remove `null` and `undefined` options so they can be replaced with default ones
        ...pickBy(config, option => !isNulled(option))
    };

    //
    // Replace environment variables
    //
    // Environment variables in .publishconfig should be in the form:
    //
    //     ${VARIABLE_NAME}
    //
    let optStr = JSON.stringify(options);
    for (const key in process.env)
    {
        if ({}.hasOwnProperty.call(process.env, key))
        {
            const envVar = "[$][{]\\b" + key + "\\b[}]";
            optStr = optStr.replace(new RegExp(envVar, "gmi"), /** @type {string} */(process.env[key]).replace(/\\/g, "\\\\"));
        }
    }

    return JSON.parse(optStr);
};


module.exports = getConfig;
