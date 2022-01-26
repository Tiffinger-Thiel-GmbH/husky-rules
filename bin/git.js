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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefixCommitMessage = exports.getCommitMessage = exports.isInDetachedMode = exports.isInMerge = exports.getBranchName = exports.getRoot = exports.gitRevParse = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cp = __importStar(require("child_process"));
const log_1 = require("./log");
//const conventionalCommitRegExp = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z- ]+\)!?)?: ([\w \S]+)$/g;
const gitVerboseStatusSeparator = '------------------------ >8 ------------------------';
function getMsgFilePath(gitRoot, index = 0) {
    (0, log_1.debug)('getMsgFilePath');
    if (gitRoot.length > 0) {
        // At first looking into this path, then if it's empty trying other ways
        if (!path.isAbsolute(gitRoot)) {
            const cwd = process.cwd();
            (0, log_1.log)(`Resolving .git path from ${cwd}`);
            gitRoot = path.resolve(cwd, gitRoot);
        }
        if (!gitRoot.includes('.git')) {
            gitRoot = path.join(gitRoot, '.git');
        }
        return path.join(gitRoot, 'COMMIT_EDITMSG');
    }
    // It is Husky 5
    if (process.env.HUSKY_GIT_PARAMS === undefined) {
        const messageFilePath = process.argv.find(arg => arg.includes('.git'));
        if (messageFilePath) {
            return messageFilePath;
        }
        else {
            throw new Error(`You are using Husky 5. Please add $1 to husky-rules's parameters.`);
        }
    }
    // Husky 2-4 stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
    const gitParams = process.env.HUSKY_GIT_PARAMS || '';
    // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
    if (!gitParams) {
        throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
    }
    // Unfortunately, this will break if there are escaped spaces within a single argument;
    // I don't believe there's a workaround for this without modifying Husky itself
    return gitParams.split(' ')[index];
}
function getMessageInfo(message, config) {
    (0, log_1.debug)(`Original commit message: ${message}`);
    const messageSections = message.split(gitVerboseStatusSeparator)[0];
    const lines = messageSections
        .trim()
        .split('\n')
        .map(line => line.trimLeft())
        .filter(line => !line.startsWith(config.commentChar));
    const cleanMessage = lines.join('\n').trim();
    (0, log_1.debug)(`Clean commit message (${cleanMessage.length}): ${cleanMessage}`);
    return {
        originalMessage: message,
        cleanMessage: cleanMessage,
        hasAnyText: message.length !== 0,
        hasUserText: cleanMessage.length !== 0,
        hasVerboseText: message.includes(gitVerboseStatusSeparator),
    };
}
function findFirstLineToInsert(lines, config) {
    let firstNotEmptyLine = -1;
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        // ignore everything after commentChar or the scissors comment, which present when doing a --verbose commit,
        // or `git config commit.status true`
        if (line === gitVerboseStatusSeparator) {
            break;
        }
        if (line.startsWith(config.commentChar)) {
            continue;
        }
        if (firstNotEmptyLine === -1) {
            firstNotEmptyLine = i;
            break;
        }
    }
    return firstNotEmptyLine;
}
function insertPrefixIntoMessage(messageInfo, prefix, config) {
    const message = messageInfo.originalMessage;
    const lines = message.split('\n').map(line => line.trimLeft());
    if (!messageInfo.hasUserText) {
        (0, log_1.debug)(`User didn't write the message. Allow empty commit is ${String(config.allowEmptyCommitMessage)}`);
        const preparedMessage = `${prefix}`;
        if (messageInfo.hasAnyText) {
            const insertedMessage = config.allowEmptyCommitMessage
                ? preparedMessage
                : `# ${preparedMessage}\n` +
                    '# husky-rules prepare commit msg > ' +
                    'Please uncomment the line above if you want to insert the prefix the into commit message';
            lines.unshift(insertedMessage);
        }
        else {
            if (config.allowEmptyCommitMessage) {
                lines.unshift(preparedMessage);
            }
            else {
                (0, log_1.debug)(`Commit message is empty. Skipping...`);
            }
        }
    }
    else {
        const firstLineToInsert = findFirstLineToInsert(lines, config);
        (0, log_1.debug)(`First line to insert is: ${firstLineToInsert > -1 ? lines[firstLineToInsert] : ''} (${firstLineToInsert})`);
        if (firstLineToInsert !== -1) {
            const line = lines[firstLineToInsert];
            if (!line.includes(prefix)) {
                lines[firstLineToInsert] = `${prefix} ${line || ''}`;
            }
        }
        // Add prefix ticket into the message in case of missing
        if (lines.every(line => !line.includes(prefix))) {
            lines[0] = `${prefix} ${lines[0] || ''}`;
        }
    }
    return lines.join('\n');
}
function gitRevParse(cwd = process.cwd()) {
    // https://github.com/typicode/husky/issues/580
    // https://github.com/typicode/husky/issues/587
    const { status, stderr, stdout } = cp.spawnSync('git', ['rev-parse', '--show-prefix', '--git-common-dir'], { cwd });
    if (status !== 0) {
        throw new Error(stderr.toString());
    }
    const [prefix, gitCommonDir] = stdout
        .toString()
        .split('\n')
        .map(s => s.trim())
        // Normalize for Windows
        .map(s => s.replace(/\\\\/, '/'));
    return { prefix, gitCommonDir };
}
exports.gitRevParse = gitRevParse;
function getRoot() {
    (0, log_1.debug)('getRoot');
    const cwd = process.cwd();
    const { gitCommonDir } = gitRevParse(cwd);
    // Git rev-parse returns unknown options as is.
    // If we get --absolute-git-dir in the output,
    // it probably means that an old version of Git has been used.
    // There seem to be a bug with --git-common-dir that was fixed in 2.13.0.
    // See issues above.
    if (gitCommonDir === '--git-common-dir') {
        throw new Error('Husky requires Git >= 2.13.0, please upgrade Git');
    }
    return path.resolve(cwd, gitCommonDir);
}
exports.getRoot = getRoot;
function getBranchName(gitRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, log_1.debug)('gitBranchName');
        return new Promise((resolve, reject) => {
            cp.exec(`git --git-dir="${gitRoot}" symbolic-ref --short HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                if (stderr) {
                    return reject(new Error(String(stderr)));
                }
                resolve(String(stdout).trim());
            });
        });
    });
}
exports.getBranchName = getBranchName;
function isInMerge(gitRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, log_1.debug)('isInMerge');
        return new Promise((resolve, reject) => {
            cp.exec(`git --git-dir="${gitRoot}" git rev-parse -q --verify MERGE_HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                if (stderr) {
                    return reject(new Error(String(stderr)));
                }
                resolve(String(stdout).trim().length > 0);
            });
        });
    });
}
exports.isInMerge = isInMerge;
function isInDetachedMode(gitRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, log_1.debug)('isInMerge');
        return new Promise((resolve, reject) => {
            cp.exec(`git --git-dir="${gitRoot}" git rev-parse --abbrev-ref HEAD`, { encoding: 'utf-8' }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                if (stderr) {
                    return reject(new Error(String(stderr)));
                }
                resolve(String(stdout).trim() === 'HEAD');
            });
        });
    });
}
exports.isInDetachedMode = isInDetachedMode;
function getCommitMessage(config) {
    (0, log_1.debug)('getCommitMessage');
    const messageFilePath = getMsgFilePath(config.gitRoot);
    let message;
    // Read file with commit message
    try {
        message = fs.readFileSync(messageFilePath, { encoding: 'utf-8' });
    }
    catch (ex) {
        throw new Error(`Unable to read the file "${messageFilePath}".`);
    }
    const messageInfo = getMessageInfo(message, config);
    return { messageInfo, messageFilePath };
}
exports.getCommitMessage = getCommitMessage;
function prefixCommitMessage(prefix, messageInfo, messageFilePath, config) {
    (0, log_1.debug)('prefixCommitMessage');
    const messageWithPrefix = insertPrefixIntoMessage(messageInfo, prefix, config);
    (0, log_1.debug)(messageWithPrefix);
    // Write message back to file
    try {
        fs.writeFileSync(messageFilePath, messageWithPrefix, { encoding: 'utf-8' });
    }
    catch (ex) {
        throw new Error(`Unable to write the file "${messageFilePath}".`);
    }
}
exports.prefixCommitMessage = prefixCommitMessage;
