/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const { isObject, isArray, isDate } = require("./type");

 /** @typedef {import("../types").MergeOptions} MergeOptions */


/**
 * @template {{}} T
 * @template {Partial<T> | {}} U
 * @param {boolean} onlyIf merge only if key does not exist in dst object, unless {@link deepObj} is `true` and both dst and src values to merge are objects
 * @param {boolean} deepArr merge array values if both dst and src values to merge are arrays.  Othersise, dst array is set to cloned src array
 * @param {T | Partial<T> | undefined} dst
 * @param {U | T | Partial<T> | undefined} src
 * @param {U | T | Partial<T> | undefined} [defaults]
 * @returns {T}
 * @throws {Error}
 */
const applyExt = (onlyIf, deepArr, dst, src, defaults) =>
{
    if (!dst) {
        dst = {};
    }
    if (!src) {
        src = {};
    }
    if (!isObject(dst) || !isObject(src)) {
        throw new Error("base argument is not an object");
    }
    if (isObject(defaults)) {
        applyExt(onlyIf, deepArr, dst, defaults);
    }
    for (const key of Object.keys(src))
    {
        if (!onlyIf || !(key in dst)) {
            dst[key] = src[key];
        }
    }
    return /** @type {T} */(dst);
};


/**
 * @template {{}} T
 * @template {Partial<T> | {}} U
 * @param {T | Partial<T> | undefined} dst
 * @param {U | T | Partial<T> | undefined} src
 * @param {U | T | Partial<T> | undefined} [defaults]
 * @returns {T}
 * @throws {Error}
 */
const apply = (dst, src, defaults) => applyExt(false, false, dst, src, defaults);


/**
 * Copies all the properties of config to object if they don't already exist.
 *
 * @template {{}} T
 * @template {Partial<T> | {}} U
 * @param {T | Partial<T> | undefined} dst
 * @param {U | T | Partial<T> | undefined} src
 * @returns {T}
 * @throws {Error}
 */
const applyIf = (dst, src) => applyExt(true, false, dst, src);


/**
 * @template T
 * @param {T} item
 * @returns {T}
 */
const clone = (item) =>
{
    if (!item) {
        return item;
    }
    if (isDate(item)) {
        return /** @type {T} */(new Date(item.getTime()));
    }
    if (isArray(item))
    {
        let i = item.length;
        const c = [];
        while (i--) { c[i] = clone(item[i]); }
        return /** @type {T} */(c);
    }
    if (isObject(item))
    {
        const c = {};
        Object.keys((item)).forEach((key) =>
        {
            c[key] = clone(item[key]);
        });
        return /** @type {T} */(c);
    }
    return item;
};


/**
 * @template {{}} T
 * @param {MergeOptions} options
 * @returns {T}
 * @throws {Error}
 */
const mergeExt2 = (options) => mergeExt(options.onlyIf, options.deepObj, options.deepArr, options.values[0], ...options.values.slice(1));


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {boolean} onlyIf merge only if key does not exist in dst object, unless {@link deepObj} is `true` and both dst and src values to merge are objects
 * @param {boolean} deepObj if both dst and src values to merge are objects, merge properties (relevant if {@link onlyIf} parameter is `true`)
 * @param {boolean} deepArr merge array values if both dst and src values to merge are arrays.  Othersise, dst array is set to cloned src array
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} values array of objects to merge, where the fist object is the `base` object that's returned in the merged state
 * @returns {T}
 * @throws {Error}
 */
const mergeExt = (onlyIf, deepObj, deepArr, ...values) =>
{
    const ln = values.length,
          base = values[0] || {};

    const _nonObj = (/** @type {string} */ key, /** @type {any} */ d, /** @type {any} */ s) =>
    {
        if (deepArr && isArray(d) && isArray(s))
        {
            base[key] = [ ...d, ...clone(s) ];
        }
        else if (!onlyIf || !(key in base))
        {
            base[key] = clone(s);
        }
    };

    if (!isObject(base)) {
        throw new Error("base argument is not an object");
    }

    for (let i = 1; i < ln; i++)
    {
        const object = values[i] || {};

        if (!isObject(object)) {
            throw new Error(`argument @ index ${i} is not an object`);
        }

        for (const key of Object.keys(object)/* .filter(key => ({}.hasOwnProperty.call(object, key)))*/)
        {
            const value = object[key],
                  baseValue = base[key];
            if (isObject(value))
            {
                if ((deepObj || !onlyIf) && isObject(baseValue))
                {
                    mergeExt(onlyIf, deepObj, deepArr, baseValue, value);
                }
                else {
                    _nonObj(key, baseValue, value);
                }
            }
            else {
                _nonObj(key, baseValue, value);
            }
        }
    }
    return /** @type {T} */(base);
};


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} values
 * @returns {T}
 * @throws {Error}
 */
const merge = (...values) => mergeExt(false, true, false, ...values);


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} values
 * @returns {T}
 * @throws {Error}
 */
const mergeWeak = (...values) => mergeExt(false, false, false, ...values);


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} values
 * @returns {T}
 * @throws {Error}
 */
const mergeIf = (...values) => mergeExt(true, true, false, ...values);


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} values
 * @returns {T}
 * @throws {Error}
 */
const mergeIfWeak = (...values) => mergeExt(true, false, false, ...values);


/**
 * @template {{}} [T=Record<string, any>]
 * @param {T} value
 * @param {...string} keys
 * @returns {T}
 */
const pick = (value, ...keys) =>
{
    const ret = {};
    keys.forEach(key => { if (value[key]) ret[key] = value[key]; });
    return /** @type {T} */(ret);
};


/**
 * @template {Record<string, T>} T
 * @param {T} value
 * @param {(arg: string) => boolean} pickFn
 * @returns {Partial<T>}
 */
const pickBy = (value, pickFn) =>
{
    const ret = {};
    Object.keys(value).filter(k => pickFn(k)).forEach(key => { if (value[key])  ret[key] = value[key]; });
    return ret;
};


/**
 * @template {{}} T
 * @template {keyof T} K
 * @param {T} value
 * @param {...K} keys
 * @returns {Omit<T, K>}
 */
const pickNot = (value, ...keys) =>
{
    const ret = { ...value };
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


module.exports = {
    apply, applyExt, applyIf, clone, merge, mergeExt, mergeExt2, mergeIf, mergeWeak, mergeIfWeak, pick, pickBy, pickNot
};
