import { db } from '../../db';
import { idempotencyRepository } from '../../repositories/SQLiteIdempotencyRepository';

export async function runIdempotencyTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${msg}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${msg}`);
    }
  }

  console.log('\n--- Running Sprint 8B.0 Idempotency Tests ---');

  const testKey = `idem_test_${Date.now()}`;
  const familyId = 1;
  const endpoint = 'POST /api/v1/family-office/life-events';
  const requestHash = 'hash_abc123';

  // Test 1: Reserve key
  const reserved = idempotencyRepository.reserveKey(testKey, familyId, endpoint, requestHash, 3600);
  assert(reserved === true, 'SQLiteIdempotencyRepository reserves new idempotency key');

  // Test 2: Double reservation fails
  const doubleReserved = idempotencyRepository.reserveKey(testKey, familyId, endpoint, requestHash, 3600);
  assert(doubleReserved === false, 'SQLiteIdempotencyRepository prevents double key reservation');

  // Test 3: Find key in progress
  const inProgress = idempotencyRepository.findKey(testKey);
  assert(inProgress !== null && inProgress.responseStatus === null, 'SQLiteIdempotencyRepository retrieves in-progress key record');

  // Test 4: Save response and retrieve cached
  const testResponseBody = { success: true, eventId: 'evt_9988' };
  idempotencyRepository.saveResponse(testKey, 201, testResponseBody);

  const completed = idempotencyRepository.findKey(testKey);
  assert(completed !== null && completed.responseStatus === 201, 'SQLiteIdempotencyRepository saves response status 201');
  assert(completed?.responseBody?.eventId === 'evt_9988', 'SQLiteIdempotencyRepository saves and parses response body');

  // Test 5: Purge expired keys (insert an expired key)
  const expiredKey = `idem_expired_${Date.now()}`;
  db.prepare(`
    INSERT INTO idempotency_keys (idempotency_key, family_id, endpoint, request_hash, expires_at)
    VALUES (?, ?, ?, ?, datetime('now', '-1 hour'))
  `).run(expiredKey, familyId, endpoint, 'hash_expired');

  const purgedCount = idempotencyRepository.purgeExpiredKeys();
  assert(purgedCount >= 1, 'SQLiteIdempotencyRepository purges expired keys');

  // Cleanup test key
  db.prepare('DELETE FROM idempotency_keys WHERE idempotency_key = ?').run(testKey);

  return { passed, failed };
}
