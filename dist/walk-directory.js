"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
async function* walkDirectory(start) {
    const directories = [start];
    while (directories.length > 0) {
        const directory = directories.pop();
        for (const filename of await fs_1.promises.readdir(directory)) {
            const file = path_1.join(directory, filename);
            if ((await fs_1.promises.stat(file)).isDirectory()) {
                directories.push(file);
            }
            else {
                yield file;
            }
        }
    }
}
exports.walkDirectory = walkDirectory;
