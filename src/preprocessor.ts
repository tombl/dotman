import { createReadStream, createWriteStream } from "fs";
import { createInterface } from "readline";

export async function preprocess(
  device: string,
  source: string,
  destination: string
) {
  const input = createReadStream(source, { encoding: "utf8" });
  const lines = createInterface(input);
  const output = createWriteStream(destination, { encoding: "utf8" });
  let currentDevice = "*";
  for await (const line of lines) {
    const index = line.indexOf("::");
    if (index !== -1) {
      currentDevice = line.slice(index + 1).split(" ")[0];
    } else if (currentDevice === "*" || currentDevice === device) {
      output.write(line + "\n");
    }
  }
  input.close();
  output.close();
}
