/* eslint-disable import/no-extraneous-dependencies */

const { posix } = require("path");
const jsdoc = require("jsdoc-api");
const capcon = require("capture-console");
const { readFile } = require("fs/promises");
const loaderUtils = require("loader-utils");
const { validate } = require("schema-utils");
const { RawSource } = require("webpack").sources;
const { urlToRequest } = require("loader-utils");
const WpBuildConsoleLogger = require("../utils/console");
const { WpBuildError, relativePath, pick } = require("../utils");


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
        let data = source, hash, newHash, cacheEntry, persistedCache;
        const options = this.getOptions(),
              identifier = 3;

        validate(schema, options, { name: "JsDoc Loader", baseDataPath: "options" });

console.log("********************* options **************************************************");
console.log(options);
console.log("********************* source **************************************************");
console.log(source);

        const traceMethod = (obj) =>
        {
            return new Proxy(obj,
            {
                get(target, methodName, receiver)
                {
                    const originMethod = target[methodName];
                    return (...args) =>
                    {
                        data += args[0];
                        return originMethod.apply(this, args);
                    };
                }
            });
        };

        const resourcePath = urlToRequest(this.resourcePath),
              resourcePathRel = posix.normalize(relativePath(options.outDir, resourcePath));

        logger.value("process input file @ ", resourcePathRel, 3);
        logger.write("   full path @ " + resourcePath, 3);

        const jsdocOptions = {
            source,
            destination: "console",
            ...pick(options, "debug", "private", "readme", "package", "configure", "verbose")
        };
console.log("********************* jsdocOptions **************************************************");
console.log(jsdocOptions);

        if (jsdocOptions.readme) {
            jsdocOptions.readme = posix.normalize(relativePath(options.outDir, jsdocOptions.readme));
        }

        if (jsdocOptions.package) {
            jsdocOptions.package = posix.normalize(relativePath(options.outDir, jsdocOptions.package));
        }

        if (jsdocOptions.configure) {
            jsdocOptions.configure = posix.normalize(relativePath(options.outDir, jsdocOptions.configure));
        }

        data = "";
        logger.value("   jsdoc execution options", jsdocOptions, 5);

        // const stderr = capcon.captureStderr(function scope() {
        //
        // });

        // data = capcon.captureStdout(function scope() { jsdoc.renderSync(data); });

        data = "";
        // the first parameter here is the stream to capture, and the
        // second argument is the function receiving the output


        // const stdio = capcon.captureStdio(function scope() {
        // });

        // const origConsole = console;
        try {
            // logger.write("   tracing console for jsdoc output", 5);
            // console = traceMethod(console);
            logger.write("   execute jsdoc", 4);
            capcon.startCapture(process.stdout, (stdout) => { data += stdout; });
            jsdoc.renderSync(jsdocOptions);
        }
        catch (e) {
            throw new WpBuildError("jsdoc loader failed: " + e.message, "loaders/jsdoc.js");
        }
        finally {
            // console = origConsole;
            capcon.stopCapture(process.stdout);

        }
console.log("********************* data **************************************************");
console.log(data);
        // logger.write("   check compilation cache for snapshot", 4);
        // try {
        //     persistedCache = this.cache.get();
        //     cacheEntry = await this.wpCacheCompilation.getPromise(`${resourcePath}|${identifier}`, null);
        // }
        // catch (e) {
        //     throw new WpBuildError("jsdoc loader failed: " + e.message, "loaders/jsdoc.js");
        // }

        // if (cacheEntry)
        // {
        //     let isValidSnapshot;
        //     logger.write("      check snapshot valid", 4);
        //     try {
        //         isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
        //     }
        //     catch (e) {
        //         throw new WpBuildError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "checking snapshot");
        //     }
        //     if (isValidSnapshot)
        //     {
        //         logger.write("      snapshot is valid", 4);
        //         ({ hash, source } = cacheEntry);
        //         newHash = newHash || this.getContentHash(source);
        //         if (newHash === hash)
        //         {
        //             logger.write("      asset is unchanged since last snapshot", 4);
        //         }
        //         else {
        //             logger.write("      asset has changed since last snapshot", 4);
        //         }
        //     }
        //     else {
        //         logger.write("      snapshot is invalid", 4);
        //     }
        // }

        if (!source)
        {
        //     let snapshot;
        //     const startTime = Date.now();
        //     data = data || await readFile(resourcePath);
        //     source = new this.compiler.webpack.sources.RawSource(data);
        //     logger.write("      create snapshot", 4);
        //     try {
        //         snapshot = await this.createSnapshot(startTime, resourcePath);
        //     }
        //     catch (e) {
        //         throw new WpBuildError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "creating snapshot " + resourcePathRel);
        //     }
        //     if (snapshot)
        //     {
        //         logger.write("      cache snapshot", 4);
        //         try {
        //             newHash = newHash || this.getContentHash(source.buffer());
        //             snapshot.setFileHashes(hash);
        //             await this.wpCacheCompilation.storePromise(`${resourcePath}|${identifier}`, null, { source, snapshot, hash });
        //             cacheEntry = await this.wpCacheCompilation.getPromise(`${resourcePath}|${identifier}`, null);
        //         }
        //         catch (e) {
        //             throw new WpBuildError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "caching snapshot " + resourcePathRel);
        //         }
        //     }
        }

        // newHash = newHash || this.getContentHash(data);
        // if (newHash === persistedCache[resourcePathRel])
        // {
        //     logger.write("   asset is unchanged", 4);
        // }
        // else {
        //     logger.write("   asset has changed, update hash in persistent cache", 4);
        //     persistedCache[resourcePathRel] = newHash;
        //     this.cache.set(persistedCache);
        // }

        // const info = {
        //     // contenthash: newHash,
        //     immutable: true, // newHash === persistedCache[filePathRel],
        //     javascriptModule: false,
        //     jsdoc: true
        // };
        // this.compilation.buildDependencies.add(filePathRel);
        // this.compilation.buildDependencies.add(resourcePath);
        // this.compilation.compilationDependencies.add();
        // this.compilation.contextDependencies.add();

        // const cache = this.compiler.getCache(`${this.app.build.name}_${this.app.build.type}_${this.app.wpc.target}`.toLowerCase());

        // this.compilation.emitAsset(resourcePathRel, source, info);

        // this.compilation.additionalChunkAssets.push(filePathRel);

        // const existingAsset = this.compilation.getAsset(resourcePathRel);
        // if (existingAsset)
        // {
        //     logger.write("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        //     logger.write("!!!!!!!!!!!*********TEST********** upfate jsdoc asset !!!!!!!!!!!!!!!!!!!!!!!!!");
        //     logger.write("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // }
        // if (!existingAsset)
        // {
            logger.write("   emit jsdoc asset", 3);
            // this.compilation.emitAsset(resourcePathRel, source, info);

            const fileName = loaderUtils.interpolateName(this, "[name]-[contenthash].[ext]", {content: source});
            this.emitFile(fileName, resourcePath);
            // this.addDependency(resourcePath);
        // }
        // else if (this.options.force)
        // {
        //     logger.write("   update asset", 3);
        //     this.compilation.updateAsset(resourcePathRel, source, info);
        // }
        // else {
        //     logger.write("      asset compared for emit", 3);
        //     this.compilation.buildDependencies.add(resourcePathRel);
        //     this.compilation.comparedForEmitAssets.add(resourcePathRel);
        //     this.compilation.compilationDependencies.add(resourcePathRel);
        // }

        // return `export default ${JSON.stringify(results)}`;
        return data; //  new RawSource(data);
		// return [ new this.compiler.webpack.sources.RawSource(data), map, meta ];
	})()
    .then((res) => callback(null, res), (err) => callback(err));

    return;
}

module.exports = jsdocLoader;
