import assert from 'node:assert/strict'
import test from 'node:test'

import * as masterDataApi from '../src/shared/api/master-data.ts'

test('does not expose legacy collection or email-id detail reads', () => {
  for (const functionName of [
    'getMasterChats',
    'getMasterCalls',
    'getMasterEmails',
    'getMasterPrompts',
    'getStudioMasterEmail',
  ]) {
    assert.equal(masterDataApi[functionName], undefined, `${functionName} should be removed`)
  }
})
