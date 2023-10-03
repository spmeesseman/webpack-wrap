// @ts-check

/**
 * @file src/loaders/wpw-jsdoc-loader/lib/jsdoc.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 *//** */

const { validate } = require("schema-utils");
const { urlToRequest } = require("loader-utils");
const typedefs = require("../../../types/typedefs");
const { asArray, isDirectory } = require("@spmeesseman/type-utils");
const { forwardSlash, findFiles, relativePath } = require("../../../utils/utils");

/** @type {typedefs.WebpackLogger} */
let logger;


/** @type {typedefs.JsonSchema} */
const schema = {
    type: "object",
    properties: {
        test: {
            type: "string"
        },
        options: {
            type: "object",
            required: [
                "config", "ext", "inputDir", "outDir", "virtualFile"
            ],
            properties: {
                entry: {
                    type: "string"
                },
                ext: {
                    type: "string"
                },
                inputDir: {
                    type: "string"
                },
                outDir: {
                    type: "string"
                },
                virtualFile: {
                    type: "string"
                },
                config: {
                    type: "object"
                }
            }
        }
    }
};


/**
 * @param {typedefs.WebpackLoaderContext} context
 * @param {string} source
 * @param {any} map
 * @param {any} meta
 * @returns {Promise<[ string, any, any ]>}
 */
async function taskLoader(context, source, map, meta)
{
    const resourcePath = forwardSlash(urlToRequest(this.resourcePath));
    logger = context.getLogger(); /* logger || new WpwLogger(
    {
        envTag1: "loader",
        envTag2: "task",
        level: 5,
        color: "white",
        colors: {
            default: "grey", buildBracket: "white", buildText: "yellow"
        }
    });*/
    logger.log("process loader request");
    logger.log("   path: " + resourcePath);

    const options = context.getOptions();
    validate(schema, options, { name: "Task Build Loader", baseDataPath: "options" });

    // context.clearDependencies();
    if (options.config.scripts)
    {
        for (const script of options.config.scripts)
        {
            for (const path of asArray(script.input))
            {
                let files;
                if (isDirectory(path)) {
                    files =  (await findFiles("**/*.*", { absolute: false, cwd: this.rootContext })).map(f => forwardSlash(f));
                }
                else {
                    files = [ relativePath(this.rootContext, path, { psx: true }) ];
                }
                for (const file of files) {
                    // const absFile = resolve(this.rootContext, file);
                    // context.addDependency(absFile);
                    // context.addBuildDependency(absFile);
                    // context.addContextDependency(dirname(absFile));
                    context._compilation?.fileDependencies.add(file);
                    logger.log("   add dependency " + file);
                }
            };
        }
    }

    return [ source, map, meta ];

    // const resourcePath = loaderUtils.urlToRequest(this.resourcePath),
    //       resourcePathRel = posix.normalize(relativePath(options.outDir, resourcePath));
    // return `export default ${JSON.stringify(results)}`;
    // return [ data ]; //  new RawSource(data);
    // return [ source, map, meta ];
}


module.exports = taskLoader;
