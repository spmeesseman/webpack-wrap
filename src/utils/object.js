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


/**
 * @template {{}} T
 * @template {Partial<T> | {}} U
 * @param {T | Partial<T> | undefined} object
 * @param {U | T | Partial<T> | undefined} config
 * @param {U | T | Partial<T> | undefined} [defaults]
 * @returns {T}
 */
const apply = (object, config, defaults) =>
{
    if (object === undefined) {
        object = {};
    }
    if (isObject(object))
    {
        if (isObject(defaults)) {
            apply(object, defaults);
        }
        if (isObject(config)) {
            Object.keys(config).forEach(i => { /** @type {{}} */(object)[i] = config[i]; });
        }
    }
    return /** @type {T} */(object);
};


/**
 * Copies all the properties of config to object if they don't already exist.
 *
 * @template {{}} T
 * @template {Partial<T> | {}} U
 * @param {T | Partial<T> | undefined} object
 * @param {U | T | Partial<T> | undefined} config
 * @returns {T}
 */
 const applyIf = (object, config) =>
 {
    if (object === undefined) {
        object = {};
    }
    if (object && isObject(config))
    {
        let property;
        for (property in config) {
            if (object[property] === undefined) {
                object[property] = config[property];
            }
        }
    }
    return /** @type {T} */(object);
};


/**
 * @template T
 * @param {any} item
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
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} destination
 * @returns {T}
 */
const merge = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        Object.keys(object)/* .filter(key => ({}.hasOwnProperty.call(object, key)))*/.forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = base[key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
                // else if (isArray(sourceKey) && isArray(value)) {
                //     base[key] = [ ...sourceKey, ...clone(value) ];
                // }
                else {
                    base[key] = clone(value);
                }
            }
            else {
                base[key] = value;
            }
        });
    }
    return /** @type {T} */(base);
};


/**
 * @template {{}} T
 * @template {Partial<T> | {}}  U
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} destination
 * @returns {T}
 */
const mergeIf = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        Object.keys(object)/* .filter(key => ({}.hasOwnProperty.call(object, key)))*/.forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = base[key];
                if (isObject(sourceKey))
                {
                    mergeIf(sourceKey, value);
                }
                // else if (isArray(sourceKey) && isArray(value)) {
                //     base[key] = [ ...sourceKey, ...clone(value) ];
                // }
                else {
                    base[key] = clone(value);
                }
            }
            else {
                base[key] = clone(value);
            }
        });
    }
    return /** @type {T} */(base);
};


/**
 * @template {{}} [T=Record<string, any>]
 * @param {T} obj
 * @param {...string} keys
 * @returns {T}
 */
const pick = (obj, ...keys) =>
{
    const ret = {};
    keys.forEach(key => { if (obj[key]) ret[key] = obj[key]; });
    return /** @type {T} */(ret);
};


/**
 * @template {Record<string, T>} T
 * @param {T} obj
 * @param {(arg: string) => boolean} pickFn
 * @returns {Partial<T>}
 */
const pickBy = (obj, pickFn) =>
{
    const ret = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => { if (obj[key])  ret[key] = obj[key]; });
    return ret;
};


/**
 * @template {{}} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {...K} keys
 * @returns {Omit<T, K>}
 */
const pickNot = (obj, ...keys) =>
{
    const ret = { ...obj };
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


module.exports = {
    apply, applyIf, clone, merge, mergeIf, pick, pickBy, pickNot
};
