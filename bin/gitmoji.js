"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceGitmoji = void 0;
const config_1 = require("./config");
const git = __importStar(require("./git"));
const gitmoji_regexp_json_1 = __importDefault(require("./gitmoji.regexp.json"));
const log_1 = require("./log");
const message = 'Prefix commits with gitmojis.';
function enforceGitmoji() {
    return __awaiter(this, void 0, void 0, function* () {
        const gitRoot = git.getRoot();
        const config = yield (0, config_1.loadConfig)();
        const { messageInfo, messageFilePath } = git.getCommitMessage(config);
        if (yield git.isInMerge(gitRoot)) {
            git.prefixCommitMessage('🔀', messageInfo, messageFilePath, config);
            process.exit(0);
        }
        // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
        const reg = new RegExp(`^${gitmoji_regexp_json_1.default.regexp} .+$`);
        if (!reg.test(messageInfo.cleanMessage)) {
            (0, log_1.log)(message);
            process.exit(1);
        }
        process.exit(0);
    });
}
exports.enforceGitmoji = enforceGitmoji;
