import { loadConfig } from './config';
import * as git from './git';
import { log } from './log';

const message = 'Your branch must match the configured regexp.';

export async function enforceBranchRegexp(): Promise<void> {
  const gitRoot = git.getRoot();
  const branch = await git.getBranchName(gitRoot);
  const config = await loadConfig();

  if (await git.isInDetachedMode(gitRoot)) {
    process.exit(0);
  }

  // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
  const reg = new RegExp(config.branchRegexp);
  if (!reg.test(branch)) {
    log(message);
    process.exit(1);
  }

  process.exit(0);
}
