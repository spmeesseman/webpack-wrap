/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync, lstatSync } = require("fs");

const toStr = Object.prototype.toString,
strValue = String.prototype.valueOf,
hasSymbols = require("has-symbols/shams"),
hasToStringTag = () =>  hasSymbols() && !!Symbol.toStringTag,
tryStringObject = (/** @type {{}} */ value) => { try { strValue.call(value); return true; } catch (e) { return false; }};


/**
 * @template T
 * @param {T} v Variable to check to see if it's an array
 * @param {boolean} [allowEmp] If `true`, return true if v is an empty array
 * @returns {v is T[]}
 */
const isArray = (v, allowEmp) => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


/**
 * @param {any} v Variable to check to see if it's a primitive boolean type
 * @returns {v is boolean}
 */
const isBoolean = (v) => (v === false || v === true) && typeof v === "boolean";


/**
 * @param {any} v Variable to check to see if it's a Date instance
 * @returns {v is Date}
 */
const isDate = (v) => !!v && Object.prototype.toString.call(v) === "[object Date]";


/**
 * @param {string} path
 * @returns {boolean}
 */
const isDirectory = (path) => existsSync(path) && lstatSync(path).isDirectory();


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [allowEmpStr] If `true`, return non-empty if isString(v) and v === ""
 * @returns {v is null | undefined | "" | []}
 */
const isEmpty = (v, allowEmpStr) => v === null || v === undefined || (!allowEmpStr ? v === "" : false) || (isArray(v) && v.length === 0) || (isObject(v) && isObjectEmpty(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isFunction = (v) => !!v && typeof v === "function";


/**
 * @param {string | undefined} path
 * @returns {boolean}
 */
const isJsTsConfigPath = (path) => !!path && isString(path, true) && /[\\\/]\.?(?:j|t)sconfig\.(?:[\w\-]+?\.)?json/.test(path);


/**
 * @template {{}} [T=Record<string, any>]
 * @param {T | undefined | null} v Variable to check to see if it's an array
 * @param {boolean} [allowArray] If `true`, return true if v is an array
 * @returns {v is T}
 */
const isObject = (v, allowArray) => !!v && Object.prototype.toString.call(v) === "[object Object]" && (v instanceof Object || typeof v === "object") && (allowArray || !isArray(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isObjectEmpty = (v) => { if (isObject(v)) { return Object.keys(v).filter(k => ({}.hasOwnProperty.call(v, k))).length === 0; } return true; };


/**
 * @param {any} v Variable to check to see if it's a primitive type (i.e. boolean / number / string)
 * @returns {v is boolean | number | string}
 */
const isPrimitive = (v) => [ "boolean", "number", "string" ].includes(typeof v);


/**
 * @template T
 * @param {PromiseLike<T> | any} v Variable to check to see if it's a promise or thenable-type
 * @returns {v is PromiseLike<T>}
 */
const isPromise = (v) => !!v && (v instanceof Promise || (isObject(v) && isFunction(v.then)));


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [notEmpty] If `false`, return false if v is a string of 0-length
 * @param {boolean} [stringifyable] If `true`, return true if v is an object and has .toString() method
 * @returns {v is string}
 */
const isString = (v, notEmpty, stringifyable) =>
    (!!v || (v === "" && !notEmpty)) && (v instanceof String || typeof v === "string") ||
    (stringifyable ? (hasToStringTag() ? tryStringObject(v) : toStr.call(v) === "[object String]") : false);


module.exports = {
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString
};
