// @ts-check

/**
 * @file src/core/source.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const JSON5 = require("json5");
const { existsSync, unlinkSync } = require("fs");
const typedefs = require("../types/typedefs");
const WpwError = require("../utils/message");
const WpwLogger = require("../utils/console");
const { spawnSync } = require("child_process");
const { resolve, basename, join, dirname } = require("path");
const { resolvePath, asArray, findFilesSync } = require("../utils");
const { apply, isString, merge, pickNot, clone } = require("@spmeesseman/type-utils");
const { writeFileSync } = require("fs");


/**
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpwSourceConfig}
 */
class WpwSource
{
    /** @type {typedefs.TypeScript | undefined} */
    static typescript;
    /** @type {typedefs.WpwBuild} */
    build;
    /** @type {typedefs.IWpwSourceTsConfig} */
    config;
    /** @type {typedefs.IWpwSourceTsConfigFile} */
    configFile;
    /** @type {typedefs.WpwSourceExtension} */
    ext;
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.WpwSourceOptions} */
    options;
    /** @type {typedefs.WpwSourceType} */
    type;


    /**
     * @param {typedefs.IWpwSourceConfig} sourceConfig
	 * @param {typedefs.WpwBuild} build
     */
    constructor(sourceConfig, build)
    {
        apply(this,
        {
            build,
            logger: build.logger,
            type: sourceConfig.type || "javascript",
            ext: sourceConfig.type === "typescript" ? "ts" : "js",
            options: clone(sourceConfig.options)
        });

        const configFileInfo = this.getJsTsConfigFileInfo(sourceConfig, build),
              compilerOptions = apply({}, sourceConfig.config?.compilerOptions);
        merge(this,
        {
            configFile: pickNot(configFileInfo, "config"),
            config: merge({}, configFileInfo.config, { compilerOptions })
        });
    };


    dispose() {}


    get dotext() { return /** @type {typedefs.WpwSourceDotExtensionApp} */(`.${this.ext}`); }


    /**
	 * @private
     * @param {any} host
     * @param {any} directoryStructureHost
     * @throws {WpwError}
     */
    createConfigHost(host, directoryStructureHost)
    {
        if (directoryStructureHost === void 0) { directoryStructureHost = host; }
        return {
            fileExists: (f) => directoryStructureHost.fileExists(f),
            readDirectory: (root, extensions, excludes, includes, depth) => {
                // ts.Debug.assertIsDefined(directoryStructureHost.readDirectory, "'CompilerHost.readDirectory' must be implemented to correctly process 'projectReferences'");
                return directoryStructureHost.readDirectory(root, extensions, excludes, includes, depth);
            },
            readFile: (f) => directoryStructureHost.readFile(f),
            useCaseSensitiveFileNames: host.useCaseSensitiveFileNames(),
            getCurrentDirectory: () => host.getCurrentDirectory(),
            onUnRecoverableConfigFileDiagnostic: host.onUnRecoverableConfigFileDiagnostic || (() => undefined),
            trace: host.trace ? (s) => host.trace(s) : undefined
        };
    }


    /**
     * @private
     * @param {typedefs.WpwSourceConfigCompilerOptions | undefined} [compilerOptions] typescript compiler options
     * @param {string[]} [files]
     * @returns {typedefs.TypeScriptProgram} TypeScriptProgram
     * @throws {WpwError}
	 */
    createProgram(compilerOptions, files)
    {
        let rootNames = files?.slice();
        const baseDir = this.configFile.dir || this.build.getBasePath(),
              ts = WpwSource.typescript = /** @type {typedefs.TypeScript} */(WpwSource.typescript || require(require.resolve("typescript")));

        if (!ts) {
            throw WpwError.get({ code: WpwError.Msg.ERROR_TYPESCRIPT, message: "typescript.program is unavailable" });
        }

        const specOptions = merge({}, this.config.compilerOptions, compilerOptions);
		Object.keys(specOptions).forEach((k) => {
			if (isString(specOptions[k]) && specOptions[k].includes("\\")) {
				specOptions[k] = specOptions[k].replace(/\\/g, "/");
			}
		});

        let configFilePath = this.configFile.path;
        if (!configFilePath) {
            configFilePath = join(baseDir, `${this.ext}config.wpwtmp.json`);
            writeFileSync(configFilePath, `{ include: [ "**/*.${this.ext}" ], exclude: [ "node_modules" ] }`);
        }
        configFilePath = configFilePath.replace(/\\/g, "/");

        const programOptions = ts.convertCompilerOptionsFromJson(specOptions, baseDir || this.build.getBasePath()),
              options = apply(programOptions.options, configFilePath ? { project: configFilePath, configFilePath } : {}),
              host = ts.createCompilerHost(options);

        if (!rootNames)
        {
            const parseConfigFileHost = this.createConfigHost(host, host),
                  parsedCmdLine = ts.getParsedCommandLineOfConfigFile(configFilePath, options, parseConfigFileHost);
            if (!parsedCmdLine) {
                throw new WpwError({ code: WpwError.Msg.ERROR_TYPESCRIPT, message: "could not set rootNames" });
            }
            rootNames = parsedCmdLine.fileNames;
        }
        else {
            rootNames = rootNames.map(f => resolvePath(baseDir, f).replace(/\\/g, "/"));
        }

        return ts.createProgram({ options, /* TODO */projectReferences: undefined, host, rootNames });
    }


    /**
     * @param {typedefs.WpwSourceConfigCompilerOptions | undefined} [compilerOptions] typescript compiler options
     * @param {boolean} [emitOnlyDts]
     * @param {string[]} [files]
     */
    emit(compilerOptions, emitOnlyDts, files)
    {
        const program = this.createProgram(compilerOptions, files),
              rootFiles = program.getRootFileNames(),
              logger = this.logger;

        logger.write("   source.typescript.emit", 1);
        logger.value("      emit types only", !!emitOnlyDts, 2);
        logger.value("      # of root files", rootFiles.length, 2);
        logger.value("      compiler options", program.getCompilerOptions(), 4);
        logger.value("      root files", rootFiles, 4);

        const result = program.emit(undefined, undefined, undefined, emitOnlyDts);
        if (result.emittedFiles) {
            logger.write(`     emitted ${result.emittedFiles.length} files`, 2);
        }
        else if (result.emitSkipped) {
            logger.value("     emit skipped", result.emitSkipped, undefined, "", logger.icons.color.warning);
        }
        if (result.diagnostics)
        {
            let dCount = 0;
            const diagMsgCt = logger.withColor(result.diagnostics.length.toString(), logger.colors.bold);
            logger.write(`      emit request produced ${diagMsgCt} diagnostic messages`, 2);
            result.diagnostics.forEach((d) =>
            {
                logger.write(`      diagnostic ${++dCount}`, undefined, "", logger.icons.color.warning);
                logger.write(`         code      : ${d.code}`, undefined, "", logger.icons.color.warning);
                logger.write(`         category  : ${d.category}`, undefined, "", logger.icons.color.warning);
                logger.write(`         message   : ${d.messageText}`, undefined, "", logger.icons.color.warning);
                logger.write(`         start     : ${d.start}`, undefined, "", logger.icons.color.warning);
                logger.write(`         file      : ${d.file?.fileName}`, undefined, "", logger.icons.color.warning);
            });
        }

        const tempConfigFile = join(this.build.getBasePath(), `${this.ext}config.wpwtmp.json`);
        if (existsSync(tempConfigFile)) {
            unlinkSync(tempConfigFile);
        }

        logger.write("   source.typescript.emit complete", 2);
        return result;
    }


    /**
     * @private
     * @param {typedefs.IWpwSourceConfig} sourceConfig
     * @param {typedefs.WpwBuild} build
     * @returns {{ file: string | undefined; files: string[] }}
     */
    findJsTsConfig(sourceConfig, build)
    {
        const cfgPath = sourceConfig.configFile?.path,
              cfgFileNames = this.type === "typescript" ? [ "tsconfig", ".tsconfig" ] : [ "jsconfig", ".jsconfig" ],
              cfgFileSuffixes = [ build.name, build.target, build.mode, build.type, "" ],
              files = findFilesSync("**/{.,}{ts,js}config.json", { cwd: build.paths.base, dot: true, absolute: true });
        /**
         * @param {string} base
         * @returns {string | undefined}
         */
        const _find = (base) =>
        {
            for (const cfgFile of cfgFileNames)
            {
                for (const cfgSuffix of cfgFileSuffixes)
                {
                    const tsCfg = join(base, `${cfgFile}.${cfgSuffix}.json`.replace("..", "."));
                    if (existsSync(tsCfg)) {
                        return tsCfg;
                    }
                }
            }
        };

        if (this.isJsTsConfigPath(cfgPath))
        {
            const curPath = resolvePath(build.paths.base, cfgPath);
            if (curPath && existsSync(curPath)) {
                return { file: curPath, files };
            }
        }

        const tryPaths = [
            build.paths.src, join(build.paths.ctx, build.name), join(build.paths.base, build.name),
            join(build.paths.ctx, build.type), join(build.paths.base, build.type), build.paths.ctx, build.paths.base
        ];

        for (const base of tryPaths)
        {
            const configFile = _find(base);
            if (configFile && existsSync(configFile)) {
                return { file: configFile, files };
            }
        }

        let globFiles = findFilesSync(`**/${cfgFileNames[0]}.${build.mode}.json`, { cwd: build.paths.base, dot: true, absolute: true });
        if (globFiles.length > 0) {
            return { file: globFiles[0], files };
        }

        globFiles = findFilesSync(`**/${cfgFileNames[0]}.json`, { cwd: build.paths.base, dot: true, absolute: true });
        if (globFiles.length === 1) {
            return { file: globFiles[0], files };
        }

        return { file: undefined, files };
    };


    /**
     * @private
     * @param {typedefs.IWpwSourceConfig} sourceConfig
     * @param {typedefs.WpwBuild} build
     * @returns {(typedefs.WpwSourceTsConfigFile & { config: typedefs.WpwSourceTsConfig})}
     */
    getJsTsConfigFileInfo(sourceConfig, build)
    {
        let dir, file, path, raw;
        const config = /** @type {typedefs.WpwSourceTsConfig} */({}),
              configFile = this.findJsTsConfig(sourceConfig, build);

        const _getData= (/** @type {string} */ file, /** @type {string} */ dir) =>
        {
            const result = spawnSync("npx", [ "tsc", `-p ${file}`, "--showConfig" ], { cwd: dir, encoding: "utf8", shell: true }),
                  data = result.stdout,
                  start = data.indexOf("{"),
                  end = data.lastIndexOf("}") + 1,
                  raw = data.substring(start, end);
            return { raw, json: /** @type {typedefs.WpwSourceTsConfig} */(JSON5.parse(raw)) };
        };

        if (configFile.file)
        {
            path = configFile.file;
            dir = dirname(configFile.file);
            file = basename(configFile.file);
            asArray(config.extends).map(e => resolve(dir, e)).filter(e => existsSync(e)).forEach((extendFile) =>
            {
                merge(config, _getData(basename(extendFile), dirname(extendFile)).json);
            });
            const buildJson = _getData(file, dir);
            raw = buildJson.raw;
            merge(config, buildJson.json);
            if (!config.files) { config.files = []; }
            if (!config.include) { config.include = []; }
            if (!config.exclude) { config.exclude = []; }
            if (!config.compilerOptions) { config.compilerOptions = {}; }
        }

        return { dir, file, path, config, raw, files: configFile.files };
    }


    /**
     * @private
     * @param {string | undefined} path
     * @returns {boolean} boolean
     */
    isJsTsConfigPath = (path) => !!path && isString(path, true) && /[\\\/]\.?(?:j|t)sconfig\.(?:[\w\-]+?\.)?json/.test(path);

}


module.exports = WpwSource;
