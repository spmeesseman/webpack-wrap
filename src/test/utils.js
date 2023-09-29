
const path = require("path");


/**
 * @function
 * @param {number} max Maximum
 * @param {number} min Minimum
 * @returns {number}
 */
const getRandomNumber = (max, min) =>
{
    const rnd = Math.random();
    /* istanbul ignore next */
    if (!max && max !== 0) {
        /* istanbul ignore next */
        max = 100000;
    }
    if (!min) {
        min = 0;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(rnd * (max - min + 1) + min);
};


/**
 * Takes an object and converts it to an encoded query string. Examples:
 *
 *     objectToQueryString({foo: 1, bar: 2});    // returns "foo=1&bar=2"
 *     objectToQueryString({foo: null, bar: 2}); // returns "foo=&bar=2"
 *
 * @param {Object<string, any>} obj The object to encode
 * @returns {string} The query string
 */
const objectToQueryString = obj => Object.keys(obj).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])).join("&");



const helper =
{
    /**
     * @param {string} p Relative paths
     * @returns {string}
     */
    getFullPath: (p) => path.normalize(path.join(getBasePath(), p))
};

module.exports = helper;
