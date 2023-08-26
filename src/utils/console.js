/* eslint-disable import/no-extraneous-dependencies */ /* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/require-property-description */
// @ts-check

const gradient = require("gradient-string");
const typedefs = require("../types/typedefs");
const { isString, isObject, isPrimitive, merge } = require("./utils");
const { isWpBuildLogColor, WpBuildLogTrueColors } = require("../types/constants");


/**
 * @class WpBuildConsoleLogger
 * @implements {typedefs.IDisposable}
 */
class WpBuildConsoleLogger
{
    /**
     * The build environment that owns the `WpBuildConsoleLogger` instance
     *
     * @private
     * @type {typedefs.WpBuildRcLog}
     */
    options;
    /**
     * @private
     * @type {import("../types/typedefs").WpBuildLogColorMapping}
     */
    defaultColor;
    /**
     * @private
     * @type {string}
     */
    infoIcon;
    /**
     * @private
     * @type {number}
     */
    separatorLength;


    /**
     * @class WpBuildConsoleLogger
     * @param {Partial<typedefs.WpBuildRcLog>} options
     */
    constructor(options)
    {
        this.applyOptions(options);
        this.separatorLength = 125; // 75 + this.options.pad.envTag + this.options.pad.base + this.options.pad.value;
        this.defaultColor = this.colors.cyan;
        const infoIconClr = this.options.colors.infoIcon || this.options.color || this.options.colors.buildBracket;
        this.infoIcon = infoIconClr ?  this.withColor(this.icons.info, this.colors[infoIconClr]) : this.icons.color.info;
        if (this.options.colors.default)
        {
            Object.keys(this.colors).filter(c => this.colors[c][1] === this.colors.system).forEach((c) =>
            {
                // @ts-ignore
                this.colors[c][1] = this.colorMap[this.options.colors.default];
            });
        }
    }

    dispose = () =>
    {
        const msg = !this.options.envTagDisable ? this.withColor("force reset console color to system default", this.colors.grey) : "";
        this.write(msg + this.withColor(" ", this.colors.system, true));
    };


    get level() { return this.options.level; }
    get valuePad() { return /** @type {number} */(this.options.pad.value); }


    /**
     * @function
     * @private
     * @param {Partial<typedefs.WpBuildRcLog>} options
     */
    applyOptions = (options) =>
    {
        let envTagLen = options.envTag1 && options.envTag2 ? options.envTag1.length + options.envTag2.length + 6 : 0;
        if (envTagLen === 0) {
            envTagLen = options.envTag1 ? options.envTag1.length + 6 : 0;
        }
        if (envTagLen === 0) {
            envTagLen = 22;
        }

        this.options = merge(
            WpBuildConsoleLogger.defaultOptions(),
            {
                envTag1: "wpbuild",
                envTag2: "info",
                pad: {
                    envTag: envTagLen
                }
            },
            options
        );

        if (!options.pad || !options.pad.envTag || envTagLen > /** @type {number} */(this.options.pad.envTag)) {
            this.options.pad.envTag = envTagLen;
        }
    }


    /**
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string | undefined | null | 0 | false} [icon]
     */
    blank(level, icon) { this.write(" ", level, "", icon); }


    /**
     * @member
     * @private
     * @type {Record<typedefs.WpBuildLogColor, typedefs.WpBuildLogColorValue>}
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


    /** @type {Record<typedefs.WpBuildLogColor, typedefs.WpBuildLogColorMapping>} */
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


    /**
     * @function
     * @static
     * @returns {typedefs.WpBuildRcLog}
     */
    static defaultOptions = () => ({ level: 2, valueMaxLineLength: 100, colors: { default: "grey" }, pad: { value: 40, base: 0 }});


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    error = (msg, pad) =>
    {
        let sMsg = msg;
        if (msg)
        {
            if (isString(msg))
            {
                sMsg = msg;
            }
            else if (msg instanceof Error)
            {
                sMsg = msg.message.trim();
                if (msg.stack) {
                    sMsg += `\n${msg.stack.trim()}`;
                }
            }
            else if (isObject<{}>(msg))
            {
                sMsg = "";
                if (msg.message) {
                    sMsg = msg.message;
                }
                if (msg.messageX) {
                    sMsg += `\n${msg.messageX}`;
                }
                sMsg = sMsg || msg.toString();
            }
            else if (!isString(msg))
            {
                sMsg = msg.toString();
            }
            this.write(sMsg, undefined, pad, this.icons.color.error);
        }
    };


    /**
     * Performs inline text coloring e.g. a message can contain ""..finished italic(main module) in 2.3s"
     * @function
     * @private
     * @param {string | undefined} msg
     * @returns {string}
     */
    format = (msg) =>
    {
        if (isString(msg, true))
        {
            for (const cKey of Object.keys(this.colors))
            {
                msg = msg.replace(new RegExp(`${cKey}\\((.*?)\\)`, "g"), (_, g1) => this.withColor(g1, this.colors[cKey]));
            }
            return msg;
        }
        return "";
    };


    /**
     * @function
     * @private
     * @param {string | undefined | null | 0 | false} icon
     * @returns {typedefs.WpBuildLogColorMapping}
     */
    getIconcolorMapping = (icon) =>
    {
        if (icon)
        {
            const clr = Object.entries(this.icons.color).find(c => isWpBuildLogColor(c[0]) && icon.includes(c[1]));
            if (clr) {
                return this.colors[clr[0]];
            }
            const icons = Object.values(this.icons).filter(i => isString(i));
            for (const i of /** @type {string[]} */(icons))
            {
                for (const c of WpBuildLogTrueColors)
                {
                    if (icon.includes(this.withColor(i, this.colors[c]))) {
                        return this.colors[c];
                    }
                }
            }
        }
        return this.colors[this.options.colors.infoIcon || this.options.color || "blue"];
    };


    /**
     * @type {typedefs.WpBuildLogIconSet}
     */
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
        blue:
        {
            error: this.withColor("✘", this.colors.blue),
            info: this.withColor("ℹ", this.colors.blue),
            success: this.withColor("✔", this.colors.blue),
            warning: this.withColor("⚠", this.colors.blue)
        },
        color:
        {
            bullet: this.withColor("●", this.colors.white),
            errorTag: this.withColor("[", this.colors.white) + this.withColor("ERROR", this.colors.red) + this.withColor("]", this.colors.white),
            info: this.withColor("ℹ", this.colors.magenta),
            star: this.withColor("★", this.colors.yellow),
            starCyan: this.withColor("★", this.colors.cyan),
            start: this.withColor("▶", this.colors.green),
            success: this.withColor("✔", this.colors.green),
            successTag: this.withColor("[", this.colors.white) + this.withColor("SUCCESS", this.colors.green) + this.withColor("]", this.colors.white),
            up: this.withColor("△", this.colors.white),
            warning: this.withColor("⚠", this.colors.yellow),
            error: this.withColor("✘", this.colors.red)
        }
    };


    /**
     * @function
     * @param {string} name
     * @param {string} version
     * @param {string} subtitle
     * @param {tinycolor.ColorInput[]} colors
     */
    printBanner = (name, version, subtitle, ...colors) =>
        WpBuildConsoleLogger.printBanner(name, version, subtitle, undefined, this);


    /**
     * @function
     * @static
     * @param {string} name
     * @param {string} version
     * @param {string} subtitle
     * @param {typedefs.WpBuildCallback} [cb]
     * @param {WpBuildConsoleLogger} [logger]
     * @param {tinycolor.ColorInput[]} colors
     */
    static printBanner = (name, version, subtitle, cb, logger, ...colors) =>
    {
        const instLogger = !!logger;
        logger = logger || new WpBuildConsoleLogger({
            envTagDisable: true, colors: { default: "grey" }, level: 5, pad: { value: 100 }
        });
        logger.sep();
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        if (colors.length === 0) {
            colors.push("red", "purple", "cyan", "pink", "green", "purple", "blue");
        }
        console.log(gradient(...colors).multiline(this.spmBanner(name, version), {interpolation: "hsv"}));
        logger.sep();
        if (subtitle) {
            logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(subtitle));
            logger.sep();
        }
        cb?.(logger);
        if (!instLogger) {
            logger.dispose();
        }
    };


    /**
     * @function
     */
    sep = () => this.write("-".padEnd(this.separatorLength, "-"));


    /**
     * @function
     * @private
     * @param {string} name
     * @param {string} version
     * @returns {string}
     */
    static spmBanner = (name, version) =>
    {
        const vPadStart = 8 - version.length + (version.length % 2 === 0 ? 1 : 0),
              vPadEnd = 8 - version.length,
              v = ("".padStart(vPadStart) + version + "".padEnd(vPadEnd)).slice(0, 11),
              n = "".padEnd(29 - (name.length / 2)) + name;
       return `           ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  // __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | ^- //_| | ___/\\\\ // ___/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\____ \\\\/\\\\___ |_|
       (_____/|_|       | /       |_|   |_| (____/${v}\\/ /        |/  \\:(           \\/
                        |/${n}`;
    };


    /**
     * @function
     * @param {string | undefined} msg
     * @param {typedefs.WpBuildLogLevel} [level]
     */
    start = (msg, level) =>  this.write(
        (this.options.color ?
            this.withColor(this.icons.start, this.colors[this.options.color]) :
            this.icons.color.start) + (msg ? "  " + msg : ""), level);

    /**
     * @function
     * @param {any} msg
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {boolean} [successIcon]
     */
    success = (msg, level, pad, successIcon) => this.writeMsgTag(
        msg, "success", level, pad,
        this.colors[this.options.colors.default] || this.colors.white,
        this.colors.green,
        successIcon ? this.icons.color.success : null
    );


    /**
     * @function
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tag = (tagMsg, bracketColor, msgColor) =>
        tagMsg ? (this.withColor("[",
                      bracketColor ||
                      (this.options.colors.tagBracket ? this.colors[this.options.colors.tagBracket] : null) ||
                      (this.options.color ? this.colors[this.options.color] : null) ||
                      this.defaultColor
                  ) +
                 this.withColor(tagMsg, msgColor || this.colors.grey)  +
                 this.withColor("]", bracketColor || this.colors.blue)) : "";

    /**
     * @function
     * Write / log a message and an aligned value to the console.  The message pad space is defined
     * by .wpbuildrc.`log.pad.value` (defaults to 45)
     * @param {string} msg
     * @param {any} val
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpBuildLogColorMapping | null} [color]
     */
    value = (msg, val, level, pad, icon, color) =>
    {
        if (level === undefined || level <= this.options.level)
        {
            let vMsg = (msg || ""),/** @type {RegExpExecArray | null} */match, colorSpace = 0;
            const vPad = this.options.pad.value || 50,
                  rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
            while ((match = rgxColorStartEnd.exec(vMsg)) !== null) {
                colorSpace += match[0].length - match[1].length;
            }
            vMsg = vMsg.padEnd(vPad + colorSpace - (pad || "").length);
            if (val || isPrimitive(val))
            {
                const rgxColorStart = /\x1B\[[0-9]{1,2}m/,
                      maxLine = this.options.valueMaxLineLength || 100;
                vMsg += (!isString(val) || !rgxColorStart.test(val) ? ": " : "");
                if (isString(val) && val.replace(rgxColorStart, "").length > maxLine && !val.trim().includes("\n"))
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
                    return;
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
            this.write(vMsg, level, pad, icon, color);
        }
    };

    /**
     * @function
     * @param {string} msg
     * @param {string} dsc
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {typedefs.WpBuildLogColorMapping | null} [iconColor]
     * @param {typedefs.WpBuildLogColorMapping | null} [msgColor]
     */
    valuestar = (msg, dsc, level, pad, iconColor, msgColor) =>
    {
        const icon = this.withColor(
            this.icons.star,
            iconColor ||
            (this.options.colors.valueStar ? this.colors[this.options.colors.valueStar] : null) ||
            (this.options.color ? this.colors[this.options.color] : null) ||
            this.defaultColor
        );
        if (this.options.colors.valueStarText && this.options.colors.valueStarText !== "white")
        {
            this.value(msg, `${icon} ${this.withColor(dsc, this.colors[this.options.colors.valueStarText])} ${icon}`, level, pad, 0, msgColor);
        }
        else {
            this.value(msg, `${icon} ${dsc} ${icon}`, level, pad, undefined, msgColor);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    warning = (msg, pad) => this.write(msg, undefined, pad, this.icons.color.warning);

    /**
     * @function
     * @param {string | undefined} msg
     * @param {typedefs.WpBuildLogColorMapping} color color value
     * @param {boolean} [sticky]
     * @returns {string}
     */
    withColor(msg, color, sticky) { return ("\x1B[" + color[0] + "m" + msg + (!sticky ? "\x1B[" + color[1] + "m" : "")); }


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildLogColorMapping} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength = (color, msg) => (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);


    /**
     * @function Write / log a message to the console
     * @param {string} msg
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpBuildLogColorMapping | null} [color]
     */
    write = (msg, level, pad = "", icon, color) =>
    {
        if (level === undefined || level <= this.options.level)
        {
            const opts = this.options,
                  envTagClr =  opts.colors.buildBracket ? this.colors[opts.colors.buildBracket] : this.getIconcolorMapping(icon),
                  envTagMsgClr = opts.colors.buildText ? this.colors[opts.colors.buildText] : this.colors.white,
                  envTagClrLen = (this.withColorLength(envTagMsgClr) * 2) + (this.withColorLength(envTagClr) * 4),
                  envMsgClr = color || this.colors[opts.colors.default || "grey"],
                  envMsg = color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ?
                            this.withColor(this.format(msg), envMsgClr) : this.format(msg),
                  envTag = !opts.envTagDisable ? (this.tag(opts.envTag1, envTagClr, envTagMsgClr) +
                            this.tag(opts.envTag2, envTagClr, envTagMsgClr)).padEnd((opts.pad.envTag || 25) + envTagClrLen) : "",
                  envIcon = !opts.envTagDisable ? (isString(icon) ? icon + " " : this.infoIcon + " ") : "";
            console.log(`${this.options.pad.base || ""}${envIcon}${envTag}${pad}${envMsg.trimEnd()}`);
        }
    };


    /**
     * @function
     * @param {string} msg
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     * @param {string | undefined | null | 0 | false} [icon]
     */
    writeMsgTag = (msg, tagMsg, level, pad, bracketColor, msgColor, icon) =>
    {
        let exPad = "";
        const match = msg.match(/^( +)[\w]/);
        if (match) { exPad = match[1]; msg = msg.trimStart(); }
        this.write(
            exPad + this.tag(tagMsg, bracketColor, msgColor) + " " +
            this.withColor(msg, this.colors[this.options.colors.default || "grey"]), level, pad, icon
        );
    };

    /**
     * @function
     * Write / log a message to the console.  This function is just a wrapper for {@link write write()} that
     * satisfies the javascript `console` interface.
     * @inheritdoc
     */
    log = this.write;
}


module.exports = WpBuildConsoleLogger;
