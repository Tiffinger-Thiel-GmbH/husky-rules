"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.log = exports.debug = void 0;
const verbose = process.argv.find(arg => arg === '--verbose');
function debug(message) {
    if (!verbose) {
        return;
    }
    console.log(`husky-rules prepare commit msg > DEBUG: ${message}`);
}
exports.debug = debug;
function log(message) {
    console.log(`husky-rules prepare commit msg > ${message}`);
}
exports.log = log;
function error(err) {
    console.error(`husky-rules prepare commit msg > ${err}`);
}
exports.error = error;
