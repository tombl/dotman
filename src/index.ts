#!/usr/bin/env node
import { bold, red } from "colorette";
import findUp from "find-up";
import { promises as fs } from "fs";
import { hostname } from "os";
import { join } from "path";
import * as toml from "toml";
import untildify from "untildify";
import { isInstalled } from "./pacman";
import { preprocess } from "./preprocessor";
import { walkDirectory } from "./walk-directory";

(async () => {
  const configPath = await findUp("dotman.toml");
  if (configPath === undefined) {
    throw new Error("dotman.toml not found");
  }
  const {
    devices,
    configs
  }: {
    devices: { [hostname: string]: string };
    configs: Array<{
      name: string;
      dest: string;
      dependencies?: string[];
      process?: string[];
    }>;
  } = toml.parse(await fs.readFile(configPath, "utf8"));
  const device = devices[hostname()];
  if (device === undefined) {
    throw new Error(`device ${hostname()} was not found in config`);
  }
  console.log(`on device ${bold(device)}`);
  let allUnmetDependencies: string[] = [];
  await Promise.all(
    configs.map(async ({ name, dest, dependencies = [], process = [] }) => {
      try {
        const destination = untildify(dest);
        await fs.mkdir(destination, { recursive: true });
        const folder = join(configPath, "..", name);
        const preprocessFiles = process.map(file => join(folder, file));
        const [, unmetDependencies] = await Promise.all([
          (async () => {
            for await (const file of walkDirectory(folder)) {
              const destinationFile = join(
                destination,
                file.slice(folder.length)
              );
              if (preprocessFiles.includes(file)) {
                await preprocess(device, file, destinationFile);
              } else {
                await fs.copyFile(file, destinationFile);
              }
            }
          })(),
          (async () =>
            (
              await Promise.all(
                dependencies.map(
                  async pkg => [pkg, await isInstalled(pkg)] as const
                )
              )
            )
              .filter(([, installed]) => !installed)
              .map(([pkg]) => pkg))()
        ]);
        allUnmetDependencies = [...allUnmetDependencies, ...unmetDependencies];
        console.log(
          `installed ${bold(name)} at ${bold(dest)}${
            unmetDependencies.length > 0
              ? ` needing ${bold(unmetDependencies.join(" "))}`
              : ""
          }`
        );
      } catch (error) {
        console.error(`failed at ${bold(name)}`, red(error));
      }
    })
  );
})().catch(error => {
  console.error(red(error));
  process.exit(1);
});
