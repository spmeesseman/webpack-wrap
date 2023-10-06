/* eslint-disable import/no-extraneous-dependencies */ /* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/require-property-description */
// @ts-check

const WpwError = require("./message");
const gradient = require("gradient-string");
const typedefs = require("../types/typedefs");
const { applySchemaDefaults } = require("./schema");
const { randomNumber, wpwVersion } = require("./utils");
const { isWpwLogColor, WpwLogTrueColors } = require("../types/constants");
const { apply, merge, typeUtils, pushUniq } = require("@spmeesseman/type-utils");

const WEBPACK = "webpack";
const SEP_GRADIENT_COLORS_COUNT = 7;
const BANNER_GRADIENT_COLORS_COUNT = 6;
const GRADIENT_X_COLORS = [ "purple", "blue", "pink", "green", "purple", "blue", "orange", "white", "cyan", "magenta", "purple" ];


/**
 * @implements {typedefs.IDisposable}
 */
class WpwLogger
{
    /**
     * @private
     * @type {boolean | undefined}
     */
    static initialized;
    /**
     * @private
     * @type {function(any, ...any): void}
     */
    static stdConsole;
    /**
     * @private
     * @type {number}
     */
    static envTagLen;
    /**
     * @private
     * @type {number}
     */
    static valuePadLen;

    /**
     * @private
     * @type {string}
     */
    infoIcon;
    /**
     * @private
     * @type {Required<typedefs.IWpwLog>}
     */
    options;
    /**
     * @private
     * @type {number}
     */
    separatorLength = 125;
    /**
     * @type {string}
     */
    staticPad = "";
    /**
     * @private
     * @type {number}
     */
    tzOffset;


    /**
     * @param {Partial<typedefs.IWpwLog>} options
     */
    constructor(options)
    {
        this.applyOptions(options);
        this.tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const infoIconClr = this.options.colors.infoIcon || this.options.color || this.options.colors.buildBracket;
        this.infoIcon = infoIconClr ?  this.withColor(this.icons.info, this.colors[infoIconClr]) : this.icons.color.info;
        if (this.options.colors.default)
        {
            Object.keys(this.colors).filter(c => this.colors[c][1] === this.colors.system).forEach((c) =>
            {
                this.colors[c][1] = this.colorMap[this.options.colors.default];
            });
        }
        if (!WpwLogger.stdConsole)
        {
            WpwLogger.stdConsole = console.log;
            console.log = (/** @type {string} */ msg, /** @type {any} */ ...args) =>
            {
                if (args[0] !== ("internal")) {
                    this.write(msg, undefined, "", null, null, false, WEBPACK);
                }
                else {
                    WpwLogger.stdConsole.apply(console, [ msg, ...args.slice(1) ]);
                }
            };
        }
        this.printBanner(options.name);
        WpwLogger.initialized = true;
    }
    /** @returns {typedefs.WpwLoggerLevel} */
    get level() { return this.options.level; }
    get valuePad() { return WpwLogger.valuePadLen; }


    /**
     * @private
     * @param {Partial<typedefs.IWpwLog>} options
     */
    applyOptions = (options) =>
    {
        const opts = this.options = merge(applySchemaDefaults(/** @type {typedefs.IWpwLog} */({}), "WpwLog"), options),
              tag2Len = opts.envTag2.length;
        let len = opts.envTag1.length + tag2Len + 6 + (this.options.level > 0 && WEBPACK.length > tag2Len ? WEBPACK.length - tag2Len : 0);
        WpwLogger.envTagLen = !WpwLogger.envTagLen || len > WpwLogger.envTagLen ? len : WpwLogger.envTagLen;
        len = opts.pad.value;
        WpwLogger.valuePadLen = !WpwLogger.valuePadLen || len > WpwLogger.valuePadLen ? len : WpwLogger.valuePadLen;
    };


    /**
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string | undefined | null | 0 | false} [icon]
     */
    blank(level, icon) { this.write(" ", level, "", icon); }


    /**
     * @member
     * @private
     * @type {Record<typedefs.WpwLogColor, typedefs.WpwLogColorValue>}
     */
    colorMap = {
        blue: 34,
        black: 0,
        cyan: 36,
        green: 32,
        grey: 90,
        magenta: 35,
        red: 31,
        system: 39,
        white: 37,
        yellow: 33,
        bold: 1,
        inverse: 7,
        italic: 3,
        underline: 4
    };


    /** @type {Record<typedefs.WpwLogColor, typedefs.WpwLogColorMapping>} */
    colors = {
        black: [ this.colorMap.black, this.colorMap.system ],
        blue: [ this.colorMap.blue, this.colorMap.system ],
        bold: [ 1, 22 ],
        cyan: [ this.colorMap.cyan, this.colorMap.system ],
        green: [ this.colorMap.green, this.colorMap.system ],
        grey: [ this.colorMap.grey, this.colorMap.system ],
        inverse: [ 7, 27 ],
        italic: [ 3, 23 ],
        magenta: [ this.colorMap.magenta, this.colorMap.system ],
        red: [ this.colorMap.red, this.colorMap.system ],
        system: [ this.colorMap.system, this.colorMap.system ],
        underline: [ 4, 24 ],
        white: [ this.colorMap.white, this.colorMap.system ],
        yellow: [ this.colorMap.yellow, this.colorMap.system ]
    };


    // TODO - extended colors
    // example gradient using extended colors:  \x1B[38;2;0;128;0mg\x1B[39m\x1B[38;2;32;144;32me\x1B[39m\x1B[38;2;64;160;64mn\x1B[39m\x1B[38;2;96;176;96me\x1B[...
    /** @type {Record<typedefs.WpwLogColorExt, typedefs.WpwLogColorExtMapping>} */
    colorsExt = {
        aliceblue: [ 240, 248, 255 ],
        antiquewhite: [ 250, 235, 215 ],
        aqua: [ 0, 255, 255 ],
        aquamarine: [ 127, 255, 212 ],
        azure: [ 240, 255, 255 ],
        beige: [ 245, 245, 220 ],
        bisque: [ 255, 228, 196 ],
        black: [ 0, 0, 0 ],
        blanchedalmond: [ 255, 235, 205 ],
        blue: [ 0, 0, 255 ],
        blueviolet: [ 138, 43, 226 ],
        brown: [ 165, 42, 42 ],
        burlywood: [ 222, 184, 135 ],
        cadetblue: [ 95, 158, 160 ],
        chartreuse: [ 127, 255, 0 ],
        chocolate: [ 210, 105, 30 ],
        coral: [ 255, 127, 80 ],
        cornflowerblue: [ 100, 149, 237 ],
        cornsilk: [ 255, 248, 220 ],
        crimson: [ 220, 20, 60 ],
        cyan: [ 0, 255, 255 ],
        darkblue: [ 0, 0, 139 ],
        darkcyan: [ 0, 139, 139 ],
        darkgoldenrod: [ 184, 134, 11 ],
        darkgreen: [ 0, 100, 0 ],
        darkgrey: [ 169, 169, 169 ],
        darkkhaki: [ 189, 183, 107 ],
        darkmagenta: [ 139, 0, 139 ],
        darkolivegreen: [ 85, 107, 47 ],
        darkorange: [ 255, 140, 0 ],
        darkorchid: [ 153, 50, 204 ],
        darkred: [ 139, 0, 0 ],
        darksalmon: [ 233, 150, 122 ],
        darkseagreen: [ 143, 188, 143 ],
        darkslateblue: [ 72, 61, 139 ],
        darkslategrey: [ 47, 79, 79 ],
        darkturquoise: [ 0, 206, 209 ],
        darkviolet: [ 148, 0, 211 ],
        deeppink: [ 255, 20, 147 ],
        deepskyblue: [ 0, 191, 255 ],
        dimgrey: [ 105, 105, 105 ],
        dodgerblue: [ 30, 144, 255 ],
        firebrick: [ 178, 34, 34 ],
        floralwhite: [ 255, 250, 240 ],
        forestgreen: [ 34, 139, 34 ],
        fuchsia: [ 255, 0, 255 ],
        gainsboro: [ 220, 220, 220 ],
        ghostwhite: [ 248, 248, 255 ],
        gold: [ 255, 215, 0 ],
        goldenrod: [ 218, 165, 32 ],
        green: [ 0, 128, 0 ],
        greenyellow: [ 173, 255, 47 ],
        grey: [ 128, 128, 128 ],
        honeydew: [ 240, 255, 240 ],
        hotpink: [ 255, 105, 180 ],
        indianred: [ 205, 92, 92 ],
        indigo: [ 75, 0, 130 ],
        ivory: [ 255, 255, 240 ],
        khaki: [ 240, 230, 140 ],
        lavender: [ 230, 230, 250 ],
        lavenderblush: [ 255, 240, 245 ],
        lawngreen: [ 124, 252, 0 ],
        lemonchiffon: [ 255, 250, 205 ],
        lightblue: [ 173, 216, 230 ],
        lightcoral: [ 240, 128, 128 ],
        lightcyan: [ 224, 255, 255 ],
        lightgoldenrodyellow: [ 250, 250, 210 ],
        lightgreen: [ 144, 238, 144 ],
        lightgrey: [ 211, 211, 211 ],
        lightpink: [ 255, 182, 193 ],
        lightsalmon: [ 255, 160, 122 ],
        lightseagreen: [ 32, 178, 170 ],
        lightskyblue: [ 135, 206, 250 ],
        lightslategrey: [ 119, 136, 153 ],
        lightsteelblue: [ 176, 196, 222 ],
        lightyellow: [ 255, 255, 224 ],
        lime: [ 0, 255, 0 ],
        limegreen: [ 50, 205, 50 ],
        linen: [ 250, 240, 230 ],
        magenta: [ 255, 0, 255 ],
        maroon: [ 128, 0, 0 ],
        mediumaquamarine: [ 102, 205, 170 ],
        mediumblue: [ 0, 0, 205 ],
        mediumorchid: [ 186, 85, 211 ],
        mediumpurple: [ 147, 112, 219 ],
        mediumseagreen: [ 60, 179, 113 ],
        mediumslateblue: [ 123, 104, 238 ],
        mediumspringgreen: [ 0, 250, 154 ],
        mediumturquoise: [ 72, 209, 204 ],
        mediumvioletred: [ 199, 21, 133 ],
        midnightblue: [ 25, 25, 112 ],
        mintcream: [ 245, 255, 250 ],
        mistyrose: [ 255, 228, 225 ],
        moccasin: [ 255, 228, 181 ],
        navajowhite: [ 255, 222, 173 ],
        navy: [ 0, 0, 128 ],
        oldlace: [ 253, 245, 230 ],
        olive: [ 128, 128, 0 ],
        olivedrab: [ 107, 142, 35 ],
        orange: [ 255, 165, 0 ],
        orangered: [ 255, 69, 0 ],
        orchid: [ 218, 112, 214 ],
        palegoldenrod: [ 238, 232, 170 ],
        palegreen: [ 152, 251, 152 ],
        paleturquoise: [ 175, 238, 238 ],
        palevioletred: [ 219, 112, 147 ],
        papayawhip: [ 255, 239, 213 ],
        peachpuff: [ 255, 218, 185 ],
        peru: [ 205, 133, 63 ],
        pink: [ 255, 192, 203 ],
        plum: [ 221, 160, 221 ],
        powderblue: [ 176, 224, 230 ],
        purple: [ 128, 0, 128 ],
        rebeccapurple: [ 102, 51, 153 ],
        red: [ 255, 0, 0 ],
        rosybrown: [ 188, 143, 143 ],
        royalblue: [ 65, 105, 225 ],
        saddlebrown: [ 139, 69, 19 ],
        salmon: [ 250, 128, 114 ],
        sandybrown: [ 244, 164, 96 ],
        seagreen: [ 46, 139, 87 ],
        seashell: [ 255, 245, 238 ],
        sienna: [ 160, 82, 45 ],
        silver: [ 192, 192, 192 ],
        skyblue: [ 135, 206, 235 ],
        slateblue: [ 106, 90, 205 ],
        slategrey: [ 112, 128, 144 ],
        snow: [ 255, 250, 250 ],
        springgreen: [ 0, 255, 127 ],
        steelblue: [ 70, 130, 180 ],
        tan: [ 210, 180, 140 ],
        teal: [ 0, 128, 128 ],
        thistle: [ 216, 191, 216 ],
        tomato: [ 255, 99, 71 ],
        turquoise: [ 64, 224, 208 ],
        violet: [ 238, 130, 238 ],
        wheat: [ 245, 222, 179 ],
        white: [ 255, 255, 255 ],
        whitesmoke: [ 245, 245, 245 ],
        yellow: [ 255, 255, 0 ],
        yellowgreen: [ 154, 205, 50 ]
    };


    dispose = () =>
    {
        const msg = !this.options.envTagDisable ? this.withColor("   force reset console color to system default", this.colors.grey) : "";
        this.write(msg + this.withColor(" ", this.colors.system, true));
    };


    /**
     * @param {any} msg
     * @param {string} [pad]
     * @param {typedefs.WpwLogColorMapping | null | undefined} [color]
     */
    error = (msg, pad, color) => this.write(this.formatObjectMessage(msg), undefined, pad, this.icons.color.error, color);


    /**
     * @param {any} msg
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad]
     * @param {boolean} [errorIcon]
     * @returns {this}
     */
    failed(msg, level, pad, errorIcon)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        return this.writeMsgTag(msg, "failed", level, pad, null, this.colors.red, errorIcon ? this.icons.color.error : null);
    }


    /**
     * Performs inline text coloring e.g. a message can contain ""..finished italic(main module) in 2.3s"
     *
     * @private
     * @param {any} msg
     * @returns {string}
     */
    formatMessage(msg)
    {
        if (typeUtils.isString(msg, true))
        {
            for (const cKey of Object.keys(this.colors))
            {
                msg = msg.replace(new RegExp(`${cKey}\\((.*?)\\)`, "g"), (_, g1) => this.withColor(g1, this.colors[cKey]));
            }
        }
        return this.formatObjectMessage(msg);
    }


    /**
     * @private
     * @param {any} msg
     * @param {boolean | undefined} [isValue]
     * @returns {string}
     */
    formatObjectMessage(msg, isValue)
    {
        let sMsg = "";
        if (typeUtils.isString(msg))
        {
            sMsg = msg;
        }
        else if (typeUtils.isPrimitive(msg))
        {
            sMsg = msg.toString();
        }
        else if (typeUtils.isError(msg))
        {
            sMsg = msg.message.trim();
            if (msg instanceof WpwError)
            {
                if (msg.details && msg.type !== "info") {
                    sMsg += `\n${msg.details}`;
                }
            }
            else if (msg.stack) {
                sMsg += `\n${msg.stack.trim()}`;
            }
        }
        else if (typeUtils.isArray(msg))
        {
            if (typeUtils.isEmpty(msg)) {
                sMsg = "[]";
            }
            else if (!typeUtils.isPrimitive(msg[0])) {
                sMsg = JSON.stringify(msg);
            }
            else {
                sMsg = "[ " + msg.join(", ") + " ]";
            }
        }
        else if (typeUtils.isDate(msg))
        {
            sMsg = msg.toLocaleString();
        }
        else if (typeUtils.isFunction(msg))
        {
            sMsg = `function:${msg.name}`;
        }
        else if (typeUtils.isPromise(msg))
        {
            sMsg = "<promise>";
        }
        else if (typeUtils.isObject<{}>(msg))
        {
            if (typeUtils.isObjectEmpty(msg)) {
                sMsg = "{}";
            }
            else if (msg.message && msg.details) {
                sMsg += `${msg.message}\n${msg.details}`;
            }
            else
            {   try {
                    sMsg = JSON.stringify(msg);
                }
                catch
                {   try {
                        sMsg = msg.toString();
                    }
                    catch {
                        sMsg = "[object]";
                    }
                }
            }
        }
        else if (msg === null)
        {
            sMsg = "null";
        }
        else if (msg === undefined)
        {
            sMsg = "undefined";
        }
        else if (typeUtils.isNulled(msg))
        {
            sMsg = "nulled";
        }
        return this.formatToMaxLine(sMsg, isValue);
    }


    /**
     * @param {string} msg
     * @param {boolean | undefined} [isValue]
     */
    formatToMaxLine(msg, isValue)
    {
        let breakMsg = msg; // 0x1B\[0x1B indicates gradient e.g. [ESC][38;2;0;128;0mg[ESC][39m[ESC][38;2;32;144;32me[ESC][39m...
        if ((/\x1B\[[0-9]{1,2}m\x1B/).test(msg)) { return breakMsg;}
        const rgxColorStart = /\x1B\[[0-9]{1,2}m/,
              maxLine = (this.options.valueMaxLineLength || 100) + (!isValue ? this.options.pad.value : 0);
        if (msg.replace(rgxColorStart, "").length > maxLine && !msg.trim().includes("\n"))
        {
            const vPad = !isValue ? 0 : WpwLogger.valuePadLen,
                  rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
            let match, xPad, clrLen,
                vMsg = "",
                v = msg.substring(0, maxLine),
                lV = v.substring(v.length - 6);
            msg = msg.substring(maxLine);
            while ((match = rgxColorStartEnd.exec(v)) !== null)
            {
                clrLen = match[0].length - match[1].length;
                xPad = clrLen < msg.length ? clrLen : msg.length;
                v += msg.substring(0, xPad);
                msg = msg.substring(xPad);
                lV = v.substring(v.length - 6);
            }
            while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
            {
                v += msg.substring(0, 1);
                msg = msg.substring(1);
                lV = v.substring(v.length - 6);
                if (rgxColorStart.test(lV) && msg[0] === "]")
                {
                    v += msg.substring(0, 3);
                    msg = msg.substring(3);
                    lV = v.substring(v.length - 6);
                }
            }
            vMsg += v;
            // this.write(vMsg, level, pad, icon, color);
            breakMsg = vMsg;
            while (msg.replace(rgxColorStart, "").length > maxLine)
            {
                vMsg = msg.substring(0, maxLine);
                msg = msg.substring(maxLine);
                lV = vMsg.substring(vMsg.length - 6);
                while ((match = rgxColorStartEnd.exec(v)) !== null)
                {
                    clrLen = match[0].length - match[1].length;
                    xPad = clrLen < msg.length ? clrLen : msg.length;
                    xPad = match[0].length - match[1].length < msg.length ? match[0].length - match[1].length : msg.length;
                    vMsg += msg.substring(0, xPad);
                    msg = msg.substring(xPad);
                    lV = vMsg.substring(vMsg.length - 6);
                }
                while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
                {
                    vMsg += msg.substring(0, 1);
                    msg = msg.substring(1);
                    lV = vMsg.substring(vMsg.length - 6);
                }
                xPad = /\x1B/.test(vMsg) ? 0 : 2;
                vMsg = "".padStart(vPad + xPad) + vMsg;
                // this.write(vMsg, level, pad, icon, color);
                breakMsg += `\n${vMsg}`;
            }
            if (msg.length > 0) {
                xPad = /\x1B/.test(msg) ? 0 : 2;
                vMsg = "".padStart(vPad + xPad) + msg;
                // this.write(vMsg, level, pad, icon, color);
                breakMsg += `\n${vMsg}`;
            }
        }
        return breakMsg.trimEnd();
    }


    /**
     * @private
     * @param {string | undefined | null | 0 | false} icon
     * @returns {typedefs.WpwLogColorMapping}
     */
    getIconcolorMapping(icon)
    {
        if (icon)
        {
            const clr = Object.entries(this.icons.color).find(c => isWpwLogColor(c[0]) && icon.includes(c[1]));
            if (clr) {
                return this.colors[clr[0]];
            }
            const icons = Object.values(this.icons).filter(i => typeUtils.isString(i));
            for (const i of /** @type {string[]} */(icons))
            {
                for (const c of WpwLogTrueColors)
                {
                    if (icon.includes(this.withColor(i, this.colors[c]))) {
                        return this.colors[c];
                    }
                }
            }
        }
        return this.colors[this.options.colors.infoIcon || this.options.color || "blue"];
    }


    /**
     * @private
     * @param {number} colorCount
     */
    gradientColors(colorCount)
    {
         const bColors = [],
               gColors = [ ...GRADIENT_X_COLORS, ...Object.keys(this.colorsExt) ];
         while (bColors.length < colorCount) {
             pushUniq(bColors, gColors[randomNumber(gColors.length - 1, 0)]);
         }
         return bColors;
     }


    /** @type {typedefs.WpwLoggerIconSet} */
    icons =
    {
        bullet: "●",
        error: "✘",
        info: "ℹ",
        star: "★",
        start: "▶",
        success: "✔",
        up: "△",
        warning: "⚠",
        /** @type {typedefs.WpwLoggerIconBlueSet} */
        blue:
        {
            error: this.withColor("✘", this.colors.blue),
            info: this.withColor("ℹ", this.colors.blue),
            success: this.withColor("✔", this.colors.blue),
            warning: this.withColor("⚠", this.colors.blue)
        },
        /** @type {typedefs.WpwLoggerIconColorSet} */
        color:
        {
            bullet: this.withColor("●", this.colors.white),
            infoTag: this.withColor("[", this.colors.white) + this.withColor("INFO", this.colors.blue) + this.withColor("]", this.colors.white),
            errorTag: this.withColor("[", this.colors.white) + this.withColor("ERROR", this.colors.red) + this.withColor("]", this.colors.white),
            info: this.withColor("ℹ", this.colors.magenta),
            star: this.withColor("★", this.colors.yellow),
            starCyan: this.withColor("★", this.colors.cyan),
            start: this.withColor("▶", this.colors.green),
            success: this.withColor("✔", this.colors.green),
            successTag: this.withColor("[", this.colors.white) + this.withColor("SUCCESS", this.colors.green) + this.withColor("]", this.colors.white),
            up: this.withColor("△", this.colors.white),
            warning: this.withColor("⚠", this.colors.yellow),
            warningTag: this.withColor("[", this.colors.white) + this.withColor("WARNING", this.colors.yellow) + this.withColor("]", this.colors.white),
            error: this.withColor("✘", this.colors.red)
        }
    };


    /**
     * Equivalent to {@link WpwLogger.write write()}, but writes regardless of current logging level
     *
     * @param {any} msg
     * @param {string} [pad]
     * @param {typedefs.WpwLogColorMapping | null | undefined} [color]
     */
    info = (msg, pad, color) => this.write(this.formatObjectMessage(msg), undefined, pad, this.icons.blue.info, color);


    /**
     * Wrapper function for {@link write write()} to intercept raw console.log calls from webpack
     * @see exports/stats.js Do not call internally.
     * @param {string} msg
     * @param {...any} args
     */
    log(msg, ...args) { this.write(msg, undefined, "", null, null, false, args && args[0] === "internal" ? undefined : "webpack"); }


    /**
     * @private
     * @param {string | undefined} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {string | undefined} [tag]
     */
    messagePrefix(pad, icon, tag)
    {
        const opts = this.options,
              basePad = this.options.pad.base || "",
              tmStamp = opts.timestamp ? this.timestamp() : "",
              envTagClr =  opts.colors.buildBracket ? this.colors[opts.colors.buildBracket] : this.getIconcolorMapping(icon),
              envTagMsgClr = opts.colors.buildText ? this.colors[opts.colors.buildText] : this.colors.white,
              envTagClrLen = (this.withColorLength(envTagMsgClr) * 2) + (this.withColorLength(envTagClr) * 4),
              envTagLen = WpwLogger.envTagLen + envTagClrLen,
              envTag = !opts.envTagDisable ? (this.tag(opts.envTag1, envTagClr, envTagMsgClr) +
                      this.tag(tag || opts.envTag2, envTagClr, envTagMsgClr)).padEnd(envTagLen) : "",
              envIcon = !opts.envTagDisable ? (typeUtils.isString(icon) ? icon + " " : this.infoIcon + " ") : "";
        return `${tmStamp}${basePad}${envIcon}${envTag}${this.staticPad}${pad || ""}`;
    }


    /**
     * @param {string} name
     * @param {Record<string, any>} obj
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad]
     * @param {boolean} [incHdrLine]
     * @param {boolean} [incNonPrimValues]
     */
    object(name, obj, level, pad, incHdrLine, incNonPrimValues)
    {
        if (level !== undefined && level > this.options.level) { return; }
        if (incHdrLine) {
            this.write(`${name.toLowerCase()} property values:`, level, pad);
        }
        Object.entries(obj).filter(o => incNonPrimValues || typeUtils.isPrimitive(o[1])).forEach(([ key, value ]) =>
        {
            this.value(`${name}.${key}`, value, level, !incHdrLine ? pad : pad + "   ");
        });
    }


    /**
     * @private
     * @param {string | undefined} [title]
     */
    printBanner(title)
    {
        if (!WpwLogger.initialized)
        {
            apply(this.options, { envTagDisable: true });
            this.sep();
            const banner = this.spmBanner();
            console.log(gradient(...this.gradientColors(BANNER_GRADIENT_COLORS_COUNT)).multiline(banner, {interpolation: "hsv"}), "internal");
            this.sep();
            if (title) {
                this.write(gradient(...this.gradientColors(SEP_GRADIENT_COLORS_COUNT)).multiline(title));
                this.sep();
            }
            apply(this.options, { envTagDisable: false });
        }
    };


    /**
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string | undefined | null | 0 | false} [icon]
     */
    sep(level, icon) { this.write("-".padEnd(this.separatorLength, "-"), level, "", icon); }


    /**
     * @private
     * @returns {string}
     */
    spmBanner()
    {
        const version = wpwVersion(),
              vPadStart = 8 - version.length + (version.length % 2 === 0 ? 1 : 0),
              vPadEnd = 8 - version.length,
              v = ("".padStart(vPadStart) + version + "".padEnd(vPadEnd)).slice(0, 11);
       return `           ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  /  __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | ^- //_| |  __/\\ \\/|/ __/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\_\\__ \\  /\\_\\__|_|
       (_____/|_|       | /       |_|   |_| (____/${v}\\/ /        |/  \\:(           \\/
                        |/                  @spmeesseman/webpack-wrap`;
    };


    /**
     * @param {string | undefined} msg
     * @param {typedefs.WpwLoggerLevel} [level]
     * @returns {this}
     */
    start(msg, level)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        return this.write((this.options.color ?
            this.withColor(this.icons.start, this.colors[this.options.color]) :
            this.icons.color.start) + (msg ? "  " + msg : ""),
            level
        );
    }


    /**
     * @param {any} msg
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad]
     * @param {boolean} [successIcon]
     * @returns {this}
     */
    success(msg, level, pad, successIcon)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        return this.writeMsgTag(msg, "success", level, pad, null, this.colors.green, successIcon ? this.icons.color.success : null);
    }


    /**
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpwLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpwLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tag(tagMsg, bracketColor, msgColor)
    {
        const bClr = bracketColor || this.tagBracketColor();
        return tagMsg ?
            (this.withColor("[", bClr) + this.withColor(tagMsg, msgColor || this.colors.grey) + this.withColor("]", bClr)) : "";
    }


    /**
     * @private
     */
    tagBracketColor()
    {
        return (this.options.colors.tagBracket ? this.colors[this.options.colors.tagBracket] : null) ||
               (this.options.color ? this.colors[this.options.color] : null) || this.colors.blue;
    }


    /**
     * @private
     */
    timestamp = () => this.withColor((new Date(Date.now() - this.tzOffset)).toISOString().slice(0, -1).split("T")[1], this.colors.grey) + " > ";


    /**
     * Write / log a message and an aligned value.  The message pad space is defined
     * by the build configuratkion value {@link typedefs.IWpwLogPad log.pad.value}
     *
     * @param {string} msg
     * @param {any} value
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpwLogColorMapping | null} [color]
     * @returns {this}
     */
    value(msg, value, level, pad, icon, color)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        const vPad = WpwLogger.valuePadLen,
              rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
        let vMsg = (this.formatMessage(msg) || ""),/** @type {RegExpExecArray | null} */match, colorSpace = 0;
        while ((match = rgxColorStartEnd.exec(vMsg)) !== null) {
            colorSpace += match[0].length - match[1].length;
        }
        vMsg = vMsg.padEnd(vPad + colorSpace - (pad || "").length - (this.staticPad || "").length);
        const rgxColorStart = /\x1B\[[0-9]{1,2}m/;
        vMsg += (!typeUtils.isString(value) || !rgxColorStart.test(value) ? ": " : "");
        vMsg += this.formatObjectMessage(value, true);
        return this.write(vMsg, level, pad, icon, color, true);
    }


    /**
     * @param {string} msg
     * @param {string} dsc
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {typedefs.WpwLogColorMapping | null} [iconColor]
     * @param {typedefs.WpwLogColorMapping | null} [msgColor]
     * @returns {this}
     */
    valuestar(msg, dsc, level, pad, iconColor, msgColor)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        const icon = this.withColor(
            this.icons.star,
            iconColor ||
            (this.options.colors.valueStar ? this.colors[this.options.colors.valueStar] : null) ||
            (this.options.color ? this.colors[this.options.color] : null) ||
            this.colors[this.options.color]
        );
        if (this.options.colors.valueStarText && this.options.colors.valueStarText !== "white")
        {
            return this.value(msg, `${icon} ${this.withColor(dsc, this.colors[this.options.colors.valueStarText])} ${icon}`, level, pad, 0, msgColor);
        }
        return this.value(msg, `${icon} ${dsc} ${icon}`, level, pad, undefined, msgColor);
    }


    /**
     * Wrapper function for {@link write write()} to intercept raw console.log calls from webpack
     * @see exports/stats.js Do not call internally.
     * @param {string} msg
     * @param {...any} _args
     */
    warn(msg, ..._args) { this.warning(msg); }


    /**
     * @param {any} msg
     * @param {string} [pad]
     * @param {typedefs.WpwLogColorMapping | null | undefined} [color]
     * @returns {this}
     */
    warning = (msg, pad, color) => this.write(this.formatObjectMessage(msg), undefined, pad, this.icons.color.warning, color);


    /**
     * @param {string | undefined} msg
     * @param {typedefs.WpwLogColorMapping} color color value
     * @param {boolean} [sticky]
     * @returns {string}
     */
    withColor(msg, color, sticky) { return ("\x1B[" + color[0] + "m" + msg + (!sticky ? "\x1B[" + color[1] + "m" : "")); }


    /**
     * @private
     * @param {typedefs.WpwLogColorMapping} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength(color, msg)
    {
        return (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);
    }


    /**
     * @param {string} msg
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpwLogColorMapping | null | undefined} [color]
     * @param {boolean | null | undefined} [isValue]
     * @param {string | undefined} [tag]
     * @returns {this}
     */
    write(msg, level, pad = "", icon, color, isValue, tag)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        const opts = this.options,
              basePad = this.options.pad.base || "",
              msgPad = !isValue ? ((/^ /).test(msg) ? "".padStart(msg.length - msg.trimStart().length) : "") : "",
              envTagClr =  opts.colors.buildBracket ? this.colors[opts.colors.buildBracket] : this.getIconcolorMapping(icon),
              envMsgClr = color || this.colors[opts.colors.default || "grey"],
              envMsg = !tag ? (color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ?
                              this.withColor(this.formatMessage(msg), envMsgClr) : this.formatMessage(msg)) :
                              (!(/\x1B\[/).test(msg) ? this.formatMessage(msg.replace(/\[(.*?)\] (.*?)$/gmi, (_, m, m2) =>
                              `${this.tag(m, envTagClr, envMsgClr)} ${this.withColor(m2, envMsgClr)}`)) : this.formatMessage(msg)),
              tmStamp = opts.timestamp ? this.timestamp() : "",
              linePad = basePad + pad + msgPad + "".padStart(WpwLogger.envTagLen + tmStamp.length
                        + 2 - (tmStamp ? this.withColorLength(this.colors.grey) : 0));
        console.log(`${this.messagePrefix(pad, icon, tag)}${envMsg.trimEnd().replace(/\n/g, "\n" + linePad)}`, "internal");
        return this;
    }


    /**
     * @param {string} msg
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpwLoggerLevel} [level]
     * @param {string} [pad]
     * @param {typedefs.WpwLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpwLogColorMapping | undefined | null} [msgColor] msg color value
     * @param {string | undefined | null | 0 | false} [icon]
     * @returns {this}
     */
    writeMsgTag(msg, tagMsg, level, pad, bracketColor, msgColor, icon)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        let exPad = "";
        const match = msg.match(/^( +)[\w]/);
        if (match) { exPad = match[1]; msg = msg.trimStart(); }
        return this.write(
            exPad + this.tag(tagMsg, bracketColor, msgColor) + " " +
            this.withColor(msg, this.colors[this.options.colors.default || "grey"]), level, pad, icon
        );
    }

}


module.exports = WpwLogger;
