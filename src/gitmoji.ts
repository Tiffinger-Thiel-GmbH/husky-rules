import { loadConfig } from './config';
import * as git from './git';
import gitmoji from './gitmoji.regexp.json';
import { log } from './log';

const message = 'Prefix commits with gitmojis.';

export async function enforceGitmoji(): Promise<void> {
  const gitRoot = git.getRoot();
  const config = await loadConfig();
  const { messageInfo, messageFilePath } = git.getCommitMessage(config);

  if (await git.isInMerge(gitRoot)) {
    git.prefixCommitMessage('🔀', messageInfo, messageFilePath, config);
    process.exit(0);
  }

  // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
  const reg = new RegExp(`^${config.beforeGitmojiRegexp}${gitmoji.regexp} .+$`);
  if (!reg.test(messageInfo.cleanMessage)) {
    log(message);
    process.exit(1);
  }

  process.exit(0);
}
