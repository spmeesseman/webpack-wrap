/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/cache.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBuild = require("../core/build");
const {  writeFile } = require("fs/promises");
const { resolve, isAbsolute } = require("path");
const { merge, clone } = require("@spmeesseman/type-utils");
const { readFileSync, existsSync, writeFileSync } = require("fs");

/** @typedef {import("../types").IDisposable} IDisposable */


/**
 * @class WpBuildCache
 * @implements {IDisposable}
 */
class WpBuildCache
{
    /**
     * @member
     * @private
     * @type {Record<string, any>}
     */
    cache;
    /**
     * @member
     * @private
     * @type {WpwBuild}
     */
    build;
    /**
     * @member
     * @private
     * @type {string}
     */
    file;


    /**
     * @class WpBuildApplication
     * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
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

    dispose = () => this.saveAsync();


    /**
     * @function
     * @returns {Record<string, any>}
     */
    get = () => merge({}, this.cache);


    /**
     * @function
     * @param {string} item
     * @returns {any}
     */
    getItem = (item) => clone(this.cache[item]);


    /**
     * @function
     * @returns {Record<string, any>}
     */
    read = () =>
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


    /**
     * @function
     */
    save = () => writeFileSync(this.file, JSON.stringify(this.cache));


    /**
     * @function
     */
    saveAsync = () => writeFile(this.file, JSON.stringify(this.cache));


    /**
     * @function
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    set = (cache) => { this.cache = merge({}, cache); this.save(); };


    /**
     * @function
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    setAsync = (cache) => { this.cache = merge({}, cache); return this.saveAsync(); };

}


module.exports = WpBuildCache;
