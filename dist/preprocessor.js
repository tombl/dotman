"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const readline_1 = require("readline");
async function preprocess(device, source, destination) {
    const input = fs_1.createReadStream(source, { encoding: "utf8" });
    const lines = readline_1.createInterface(input);
    const output = fs_1.createWriteStream(destination, { encoding: "utf8" });
    let currentDevice = "*";
    for await (const line of lines) {
        const index = line.indexOf("::");
        if (index !== -1) {
            currentDevice = line.slice(index + 1).split(" ")[0];
        }
        else if (currentDevice === "*" || currentDevice === device) {
            output.write(line + "\n");
        }
    }
    input.close();
    output.close();
}
exports.preprocess = preprocess;
