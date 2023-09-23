/* eslint-disable import/no-extraneous-dependencies */ /* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/require-property-description */
// @ts-check

const WpwError = require("./message");
const gradient = require("gradient-string");
const typedefs = require("../types/typedefs");
const { applySchemaDefaults } = require("./schema");
const { apply, merge, typeUtils } = require("@spmeesseman/type-utils");
const { isWpwLogColor, WpwLogTrueColors } = require("../types/constants");

const BANNER_GRADIENT_COLORS = [ "purple", "blue", "pink", "green", "purple", "blue" ];
const SEP_GRADIENT_COLORS = [ "red", "purple", "cyan", "pink", "green", "purple", "blue" ];


/**
 * @implements {typedefs.IDisposable}
 */
class WpwLogger
{
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
    separatorLength;
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
        this.separatorLength = 125;
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
        const opts = this.options = merge(applySchemaDefaults(/** @type {typedefs.IWpwLog} */({}), "WpwLog"), options);
        let len = opts.envTag1.length + opts.envTag2.length + 6;
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


    dispose = () =>
    {
        const msg = !this.options.envTagDisable ? this.withColor("force reset console color to system default", this.colors.grey) : "";
        this.write(msg + this.withColor(" ", this.colors.system, true));
    };


    /**
     * @param {any} msg
     * @param {string} [pad]
     * @param {typedefs.WpwLogColorMapping | null | undefined} [color]
     */
    error = (msg, pad, color) => this.write(this.formatObjectMessage(msg), undefined, pad, this.icons.color.error, color);


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
            return msg;
        }
        return this.formatObjectMessage(msg);
    }


    /**
     * @private
     * @param {any} msg
     * @returns {string}
     */
    formatObjectMessage(msg)
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
        return sMsg;
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
     * @param {string} name
     * @param {string} version
     * @param {string} title
     * @param {tinycolor.ColorInput[]} colors
     */
    printBanner(name, version, title, ...colors) { WpwLogger.printBanner(name, version, title, null, this, ...colors); }


    /**
     * @param {string} name
     * @param {string} version
     * @param {string} subtitle
     * @param {((logger: WpwLogger) => unknown) | null | undefined} [cb]
     * @param {WpwLogger} [logger]
     * @param {tinycolor.ColorInput[]} colors
     */
    static printBanner(name, version, subtitle, cb, logger, ...colors)
    {
        const instLogger = !!logger;
        logger = logger || new WpwLogger({ color: "cyan", colors: { default: "grey" }, level: 5, pad: { value: 100 }});
        apply(logger.options, { envTagDisable: true });
        logger.sep();
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        if (colors.length === 0) {
            colors.push(...SEP_GRADIENT_COLORS);
        }
        console.log(gradient(...colors).multiline(this.spmBanner(name, version), {interpolation: "hsv"}));
        logger.sep();
        if (subtitle) {
            logger.write(gradient(...BANNER_GRADIENT_COLORS).multiline(subtitle));
            logger.sep();
        }
        cb?.(logger);
        if (!instLogger) {
            logger.dispose();
        }
        else {
            apply(logger.options, { envTagDisable: false });
        }
    };


    sep() { this.write("-".padEnd(this.separatorLength, "-")); }


    /**
     * @private
     * @param {string} name
     * @param {string} version
     * @returns {string}
     */
    static spmBanner(name, version)
    {
        const vPadStart = 8 - version.length + (version.length % 2 === 0 ? 1 : 0),
              vPadEnd = 8 - version.length,
              v = ("".padStart(vPadStart) + version + "".padEnd(vPadEnd)).slice(0, 11),
              n = "".padEnd(29 - (name.length / 2)) + name;
       return `           ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  /  __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | ^- //_| |  __/\\ \\/|/ __/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\_\\__ \\  /\\_\\__|_|
       (_____/|_|       | /       |_|   |_| (____/${v}\\/ /        |/  \\:(           \\/
                        |/${n}`;
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
        return this.writeMsgTag(
            msg, "success", level, pad,
            this.options.colors.default ? this.colors[this.options.colors.default] : this.colors.white,
            this.colors.green,
            successIcon ? this.icons.color.success : null
        );
    }


    /**
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpwLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpwLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tag(tagMsg, bracketColor, msgColor)
    {
        const bClr = bracketColor ||
                    (this.options.colors.tagBracket ? this.colors[this.options.colors.tagBracket] : null) ||
                    (this.options.color ? this.colors[this.options.color] : null) || this.colors[this.options.color];
        return tagMsg ?
            (this.withColor("[", bClr) + this.withColor(tagMsg, msgColor || this.colors.grey) + this.withColor("]", bClr)) : "";
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

        let val = value, vMsg = (this.formatMessage(msg) || ""),/** @type {RegExpExecArray | null} */match, colorSpace = 0;
        const vPad = WpwLogger.valuePadLen,
              rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;

        while ((match = rgxColorStartEnd.exec(vMsg)) !== null) {
            colorSpace += match[0].length - match[1].length;
        }
        vMsg = vMsg.padEnd(vPad + colorSpace - (pad || "").length);

        if (val || typeUtils.isPrimitive(val))
        {
            const rgxColorStart = /\x1B\[[0-9]{1,2}m/,
                  maxLine = this.options.valueMaxLineLength || 100;

            vMsg += (!typeUtils.isString(val) || !rgxColorStart.test(val) ? ": " : "");
            val = this.formatObjectMessage(val);

            if (typeUtils.isString(val) && val.replace(rgxColorStart, "").length > maxLine && !val.trim().includes("\n"))
            {
                let xPad, clrLen,
                    v = val.substring(0, maxLine),
                    lV = v.substring(v.length - 6);
                val = val.substring(maxLine);
                while ((match = rgxColorStartEnd.exec(v)) !== null)
                {
                    clrLen = match[0].length - match[1].length;
                    xPad = clrLen < val.length ? clrLen : val.length;
                    v += val.substring(0, xPad);
                    val = val.substring(xPad);
                    lV = v.substring(v.length - 6);
                }
                while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
                {
                    v += val.substring(0, 1);
                    val = val.substring(1);
                    lV = v.substring(v.length - 6);
                    if (rgxColorStart.test(lV) && val[0] === "]")
                    {
                        v += val.substring(0, 3);
                        val = val.substring(3);
                        lV = v.substring(v.length - 6);
                    }
                }
                vMsg += v;
                this.write(vMsg, level, pad, icon, color);
                while (val.replace(rgxColorStart, "").length > maxLine)
                {
                    vMsg = val.substring(0, maxLine);
                    val = val.substring(maxLine);
                    lV = vMsg.substring(vMsg.length - 6);
                    while ((match = rgxColorStartEnd.exec(v)) !== null)
                    {
                        clrLen = match[0].length - match[1].length;
                        xPad = clrLen < val.length ? clrLen : val.length;
                        xPad = match[0].length - match[1].length < val.length ? match[0].length - match[1].length : val.length;
                        vMsg += val.substring(0, xPad);
                        val = val.substring(xPad);
                        lV = vMsg.substring(vMsg.length - 6);
                    }
                    while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
                    {
                        vMsg += val.substring(0, 1);
                        val = val.substring(1);
                        lV = vMsg.substring(vMsg.length - 6);
                    }
                    xPad = /\x1B/.test(vMsg) ? 0 : 2;
                    vMsg = "".padStart(vPad + xPad) + vMsg;
                    this.write(vMsg, level, pad, icon, color);
                }
                if (val.length > 0) {
                    xPad = /\x1B/.test(val) ? 0 : 2;
                    vMsg = "".padStart(vPad + xPad) + val;
                    this.write(vMsg, level, pad, icon, color);
                }
                return this;
            }
            else {
                vMsg += val;
            }
        }
        else if (val === undefined) {
            vMsg += ": undefined";
        }
        else {
            vMsg += ": null";
        }
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
     * @returns {this}
     */
    write(msg, level, pad = "", icon, color, isValue)
    {
        if (level !== undefined && level > this.options.level) { return this; }
        const opts = this.options,
                basePad = this.options.pad.base || "",
                msgPad = (/^ /).test(msg) ? "".padStart(msg.length - msg.trimStart().length) : "",
                linePad = isValue !== true ? basePad + pad + msgPad + "".padStart(WpwLogger.envTagLen + 2) : "",
                envTagClr =  opts.colors.buildBracket ? this.colors[opts.colors.buildBracket] : this.getIconcolorMapping(icon),
                envTagMsgClr = opts.colors.buildText ? this.colors[opts.colors.buildText] : this.colors.white,
                envTagClrLen = (this.withColorLength(envTagMsgClr) * 2) + (this.withColorLength(envTagClr) * 4),
                envMsgClr = color || this.colors[opts.colors.default || "grey"],
                envMsg = color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ?
                                this.withColor(this.formatMessage(msg), envMsgClr) : this.formatMessage(msg),
                envTagLen = WpwLogger.envTagLen + envTagClrLen,
                envTag = !opts.envTagDisable ? (this.tag(opts.envTag1, envTagClr, envTagMsgClr) +
                        this.tag(opts.envTag2, envTagClr, envTagMsgClr)).padEnd(envTagLen) : "",
                envIcon = !opts.envTagDisable ? (typeUtils.isString(icon) ? icon + " " : this.infoIcon + " ") : "",
                tmStamp = opts.timestamp ? this.timestamp() : "";
        console.log(`${tmStamp}${basePad}${envIcon}${envTag}${pad}${envMsg.trimEnd().replace(/\n/g, "\n" + linePad)}`);
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


    /**
     * just a wrapper for {@link write write()} that satisfies the javascript `console` interface
     */
    log = this.write;
}


module.exports = WpwLogger;
