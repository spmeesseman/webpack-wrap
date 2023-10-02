/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/cache.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { writeFile } = require("fs/promises");
const typedefs = require("../types/typedefs");
const { resolve, isAbsolute } = require("path");
const { merge, clone } = require("@spmeesseman/type-utils");
const { readFileSync, existsSync, writeFileSync } = require("fs");


/**
 * @implements {typedefs.IDisposable}
 */
class WpwCache
{
    /**
     * @private
     * @type {Record<string, any>}
     */
    cache;
    /**
     * @private
     * @type {typedefs.WpwBuild}
     */
    build;
    /**
     * @private
     * @type {string}
     */
    file;


    /**
     * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
     * @param {string} file Filename to read/write cache to
     */
    constructor(build, file)
    {
        this.build = build;
        if (!isAbsolute(file)) {
            this.file = resolve(this.build.global.cacheDir, file);
        }
        this.cache = this.read();
    }


    dispose() { this.saveAsync(); }


    /**
     * @returns {Record<string, any>}
     */
    get() { return merge({}, this.cache); }


    /**
     * @param {string} item
     * @returns {any}
     */
    getItem(item) { return clone(this.cache[item]); }


    /**
     * @returns {Record<string, any>}
     */
    read()
    {
        let jso;
        if (!existsSync(this.file)) {
            writeFileSync(this.file, "{}");
        }
        try {
            jso = JSON.parse(readFileSync(this.file, "utf8"));
        }
        catch (e) { jso = {}; }
        return jso;
    };


    save() { writeFileSync(this.file, JSON.stringify(this.cache)); }


    saveAsync() { writeFile(this.file, JSON.stringify(this.cache)); }


    /**
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    set(cache) { this.cache = merge({}, cache); this.save(); };


    /**
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    setAsync(cache) { this.cache = merge({}, cache); return this.saveAsync(); };

}


module.exports = WpwCache;
