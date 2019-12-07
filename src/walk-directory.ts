import { promises as fs } from "fs";
import { join } from "path";

export async function* walkDirectory(start: string) {
  const directories = [start];
  while (directories.length > 0) {
    const directory = directories.pop()!;
    for (const filename of await fs.readdir(directory)) {
      const file = join(directory, filename);
      if ((await fs.stat(file)).isDirectory()) {
        directories.push(file);
      } else {
        yield file;
      }
    }
  }
}
