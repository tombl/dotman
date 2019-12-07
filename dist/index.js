#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const colorette_1 = require("colorette");
const find_up_1 = tslib_1.__importDefault(require("find-up"));
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const toml = tslib_1.__importStar(require("toml"));
const untildify_1 = tslib_1.__importDefault(require("untildify"));
const pacman_1 = require("./pacman");
const preprocessor_1 = require("./preprocessor");
const walk_directory_1 = require("./walk-directory");
(async () => {
    const configPath = await find_up_1.default("dotman.toml");
    if (configPath === undefined) {
        throw new Error("dotman.toml not found");
    }
    const { devices, configs } = toml.parse(await fs_1.promises.readFile(configPath, "utf8"));
    const device = devices[os_1.hostname()];
    if (device === undefined) {
        throw new Error(`device ${os_1.hostname()} was not found in config`);
    }
    console.log(`on device ${colorette_1.bold(device)}`);
    let allUnmetDependencies = [];
    await Promise.all(configs.map(async ({ name, dest, dependencies = [], process = [] }) => {
        try {
            const destination = untildify_1.default(dest);
            await fs_1.promises.mkdir(destination, { recursive: true });
            const folder = path_1.join(configPath, "..", name);
            const preprocessFiles = process.map(file => path_1.join(folder, file));
            const [, unmetDependencies] = await Promise.all([
                (async () => {
                    for await (const file of walk_directory_1.walkDirectory(folder)) {
                        const destinationFile = path_1.join(destination, file.slice(folder.length));
                        if (preprocessFiles.includes(file)) {
                            await preprocessor_1.preprocess(device, file, destinationFile);
                        }
                        else {
                            await fs_1.promises.copyFile(file, destinationFile);
                        }
                    }
                })(),
                (async () => (await Promise.all(dependencies.map(async (pkg) => [pkg, await pacman_1.isInstalled(pkg)])))
                    .filter(([, installed]) => !installed)
                    .map(([pkg]) => pkg))()
            ]);
            allUnmetDependencies = [...allUnmetDependencies, ...unmetDependencies];
            console.log(`installed ${colorette_1.bold(name)} at ${colorette_1.bold(dest)}${unmetDependencies.length > 0
                ? ` needing ${colorette_1.bold(unmetDependencies.join(" "))}`
                : ""}`);
        }
        catch (error) {
            console.error(`failed at ${colorette_1.bold(name)}`, colorette_1.red(error));
        }
    }));
})().catch(error => {
    console.error(colorette_1.red(error));
    process.exit(1);
});
