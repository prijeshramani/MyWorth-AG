import { db } from '../../db';
import { auditHookService } from '../../infrastructure/audit/AuditHookService';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';

export async function runAuditHooksTests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Running Sprint 8B.0 Audit Hooks & Event Bus Tests ---');

  let receivedEvent: any = null;

  // Test 1: Subscribe to domain event
  auditHookService.subscribe('TEST_EVENT_FIRED', (event) => {
    receivedEvent = event;
  });

  // Test 2: Create and publish event within correlation context
  const testStore = {
    correlationId: 'req_audit_test_77',
    familyId: 1,
    timestamp: new Date().toISOString()
  };

  await CorrelationContext.runWithContext(testStore, async () => {
    const published = await auditHookService.createAndPublishEvent({
      eventType: 'TEST_EVENT_FIRED',
      aggregateType: 'TEST_AGGREGATE',
      aggregateId: 'agg_44',
      familyId: 1,
      payload: { value: 12345 }
    });

    assert(published.correlationId === 'req_audit_test_77', 'AuditHookService assigns active correlationId to event');
  });

  // Test 3: Listener received event
  assert(receivedEvent !== null && receivedEvent.eventType === 'TEST_EVENT_FIRED', 'AuditHookService dispatches event to registered subscriber');
  assert(receivedEvent?.payload?.value === 12345, 'AuditHookService preserves event payload');

  // Test 4: Verify audit trail DB record was written
  const auditRow = db.prepare(`
    SELECT * FROM ai_audit_trail 
    WHERE action_id = ?
  `).get(receivedEvent.eventId) as any;

  assert(auditRow !== undefined, 'AuditHookService records event in ai_audit_trail table');
  assert(auditRow?.user_decision === 'AUDITED', 'Audit record is marked as AUDITED');

  // Clean up audit record
  if (auditRow) {
    db.prepare('DELETE FROM ai_audit_trail WHERE id = ?').run(auditRow.id);
  }

  return { passed, failed };
}
