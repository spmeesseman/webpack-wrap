/* eslint-disable import/no-extraneous-dependencies */

const { validate } = require("schema-utils");
const { urlToRequest } = require("loader-utils");
const WpBuildConsoleLogger = require("../utils/console");
const { execAsync, WpBuildError } = require("../utils");

/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    properties: {
        test: {
            type: "string"
        },
        options: {
            type: "object",
            properties: {
                outDir: {
                    type: "string"
                },
                inputDir: {
                    type: "string"
                }
            }
        }
    }
};

const logger = new WpBuildConsoleLogger({
    envTag1: "loader", envTag2: "jsdoc", colors: { default: "grey" }, level: 5
});


async function jsdocLoader(source, map, meta)
{
    const callback = this.async();
	(async () =>
    {
        const options = this.getOptions(),
              resourcePath = urlToRequest(this.resourcePath);

        validate(schema, options, { name: "JsDoc Loader", baseDataPath: "options" });

        logger.value("request path", resourcePath, 2);

        const code = await execAsync({ command: `npx jsdoc -d "${options.outDir}" -r ./src`, program: "jsdoc" });
        if (code !== 0)
        {
            throw new WpBuildError("jsdoc loader failed building file" + code, "plugins/jsdoc.js");
        }

		return [ source, map, meta ];
	})()
    .then(
        (res) => callback(null, ...res),
        (err) => callback(err)
    );
    return;
}

module.exports = jsdocLoader;
