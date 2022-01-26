"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const cosmiconfig_1 = require("cosmiconfig");
const log_1 = require("./log");
const defaultConfig = {
    branchRegexp: '([A-Z]+-\\d+)',
    commentChar: '#',
    allowEmptyCommitMessage: false,
    gitRoot: '',
};
function resolveConfig(configPath) {
    try {
        return require.resolve(configPath);
    }
    catch (_a) {
        return configPath;
    }
}
function loadConfig(configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const explorer = (0, cosmiconfig_1.cosmiconfig)('husky-rules', {
                searchPlaces: [
                    'package.json',
                    '.huskyrulesrc',
                    '.huskyrulesrc.json',
                    '.huskyrulesrc.yaml',
                    '.huskyrulesrc.yml',
                    'husky-rules.config.js',
                ],
            });
            const config = configPath ? yield explorer.load(resolveConfig(configPath)) : yield explorer.search();
            (0, log_1.debug)(`Loaded config: ${JSON.stringify(config)}`);
            if (config && !config.isEmpty) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const result = Object.assign(Object.assign({}, defaultConfig), config.config);
                (0, log_1.debug)(`Used config: ${JSON.stringify(result)}`);
                return result;
            }
        }
        catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            (0, log_1.error)(`Loading configuration failed with error: ${err}`);
        }
        const result = Object.assign({}, defaultConfig);
        (0, log_1.debug)(`Used config: ${JSON.stringify(result)}`);
        return result;
    });
}
exports.loadConfig = loadConfig;
