"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
async function isInstalled(pkg) {
    const { exitCode } = await execa_1.default("pacman", ["-Q", pkg], {
        reject: false
    });
    if (exitCode > 1) {
        throw new Error(`pacman exited with error code: ${exitCode}`);
    }
    return exitCode === 0;
}
exports.isInstalled = isInstalled;
