import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';

export async function runCorrelationTests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Running Sprint 8B.0 Correlation Context Tests ---');

  // Test 1: Fallback correlation ID generation outside context
  const fallbackId = CorrelationContext.getCorrelationId();
  assert(typeof fallbackId === 'string' && fallbackId.startsWith('req_'), 'CorrelationContext generates fallback req_ ID outside context');

  // Test 2: Async context propagation
  const testStore = {
    correlationId: 'req_test_12345',
    causationId: 'evt_parent_999',
    familyId: 42,
    userId: 10,
    timestamp: new Date().toISOString()
  };

  await CorrelationContext.runWithContext(testStore, async () => {
    assert(CorrelationContext.getCorrelationId() === 'req_test_12345', 'CorrelationContext retrieves active correlationId in async block');
    assert(CorrelationContext.getCausationId() === 'evt_parent_999', 'CorrelationContext retrieves active causationId in async block');
    assert(CorrelationContext.getFamilyId() === 42, 'CorrelationContext retrieves active familyId in async block');
    assert(CorrelationContext.getUserId() === 10, 'CorrelationContext retrieves active userId in async block');

    // Simulate nested async promise
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert(CorrelationContext.getCorrelationId() === 'req_test_12345', 'CorrelationContext maintains correlationId across setTimeout delay');
  });

  // Test 3: Id generation utility
  const eventId = CorrelationContext.generateId('evt');
  assert(eventId.startsWith('evt_'), 'CorrelationContext.generateId produces prefixed UUID');

  return { passed, failed };
}
