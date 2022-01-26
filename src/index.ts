#!/usr/bin/env node

import { enforceGitmoji } from './gitmoji';
import { enforceBranchRegexp } from './regexp';
import { error, log } from './log';

void (async (): Promise<void> => {
  try {
    if (process.argv[1] === 'gitmoji') {
      await enforceGitmoji();
    } else if (process.argv[1] === 'enforceRegexpBranch') {
      await enforceBranchRegexp();
    }
  } catch (err: unknown) {
    if (typeof err === 'string') {
      error(err);
    } else {
      error(String(err));
    }
  }

  log('done');
})();
