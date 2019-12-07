import exec from "execa";

export async function isInstalled(pkg: string): Promise<boolean> {
  const { exitCode } = await exec("pacman", ["-Q", pkg], {
    reject: false
  });
  if (exitCode > 1) {
    throw new Error(`pacman exited with error code: ${exitCode}`);
  }
  return exitCode === 0;
}
