import { digitalTwinService } from '../../services/familyOffice/DigitalTwinService';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { db } from '../../db';
import { DigitalTwinStateSchema } from '../../contracts/familyOfficeContracts';
import { familyRepository } from '../../repositories/SQLiteFamilyRepository';

export async function runDigitalTwinTests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Running Sprint 8B.1 Digital Twin Foundation & State Hydration Tests ---');

  // Discover active populated family in database (e.g. Family 6 or Family 1)
  const allFamilies = familyRepository.findAll();
  const targetFamily = allFamilies.find(f => f.id === 6) || allFamilies[0] || { id: 1, name: 'Default Family' };
  const targetFamilyId = targetFamily.id;

  // Test 1: Real Multi-Member Family Hydration
  try {
    const correlationId = CorrelationContext.generateId('corr_test');
    const timestamp = new Date().toISOString();
    const result = await CorrelationContext.runWithContext({ correlationId, familyId: targetFamilyId, timestamp }, async () => {
      return await digitalTwinService.getDigitalTwin(targetFamilyId);
    });

    assert(result !== undefined, `DigitalTwinService returns result for Family ${targetFamilyId}`);
    assert(result.state.familyId === targetFamilyId, `Digital Twin state familyId matches requested family (${targetFamilyId})`);
    assert(Array.isArray(result.state.lineage.members), `Family ${targetFamilyId} lineage contains members array`);
    assert(result.state.balanceSheet.grossAssets >= 0, `Family ${targetFamilyId} balance sheet has non-negative grossAssets`);
    assert(typeof result.state.dataCompletenessScore === 'number', 'Digital Twin has numerical completeness score');
    
    // Contract verification
    const parsed = DigitalTwinStateSchema.parse(result.state);
    assert(parsed.familyId === targetFamilyId, 'Digital Twin state conforms 100% to DigitalTwinStateSchema');
  } catch (err: any) {
    assert(false, `Family ${targetFamilyId} hydration failed: ${err.message}`);
  }

  // Test 2: 5-Pillar Completeness Scoring Breakdown
  try {
    const completeness = await digitalTwinService.getCompleteness(targetFamilyId);
    assert(completeness.overallScore >= 0 && completeness.overallScore <= 100, 'Overall completeness score is between 0 and 100');
    assert(completeness.status === 'COMPLETE' || completeness.status === 'PARTIAL' || completeness.status === 'INSUFFICIENT_DATA', 'Completeness status is valid tier');
    assert(Array.isArray(completeness.missingElements), 'Completeness missingElements is an array');
    assert(typeof completeness.lineageScore === 'number', 'Lineage score is numeric');
    assert(typeof completeness.balanceSheetScore === 'number', 'Balance sheet score is numeric');
    assert(typeof completeness.protectionScore === 'number', 'Protection score is numeric');
    assert(typeof completeness.trajectoryScore === 'number', 'Trajectory score is numeric');
    assert(typeof completeness.governanceScore === 'number', 'Governance score is numeric');
  } catch (err: any) {
    assert(false, `Completeness scoring failed: ${err.message}`);
  }

  // Test 3: Canonical State Hash Determinism & Volatile Exclusion
  try {
    const twin1 = await digitalTwinService.getDigitalTwin(targetFamilyId);
    const hash1 = twin1.metadata.stateHash;

    // Mutate only volatile metadata in twin1 clone
    const clonedState = JSON.parse(JSON.stringify(twin1.state));
    clonedState.timestamp = new Date(Date.now() + 100000).toISOString(); // different timestamp

    const hash2 = digitalTwinService.computeCanonicalStateHash(clonedState);
    assert(hash1 === hash2, 'Canonical stateHash is deterministic and excludes volatile timestamp');
  } catch (err: any) {
    assert(false, `State hash determinism failed: ${err.message}`);
  }

  // Test 4: Empty / New Family Isolation & Zero Fallbacks
  let testFamilyId: number | null = null;
  try {
    const insertRes = db.prepare(`INSERT INTO families (name, currency) VALUES ('Test Empty Family', 'INR')`).run();
    testFamilyId = Number(insertRes.lastInsertRowid);

    const emptyTwin = await digitalTwinService.getDigitalTwin(testFamilyId);
    assert(emptyTwin.state.familyId === testFamilyId, 'Empty family hydrates with correct familyId');
    assert(emptyTwin.state.lineage.members.length === 0, 'Empty family has 0 lineage members');
    assert(emptyTwin.state.balanceSheet.grossAssets === 0, 'Empty family has 0 grossAssets');
    assert(emptyTwin.state.protection.activeTermCover === 0, 'Empty family has 0 activeTermCover');
    assert(emptyTwin.state.protection.requiredHlvCover === 0, 'Empty family has 0 requiredHlvCover (no ₹2.5 Cr fallback)');
    assert(emptyTwin.metadata.completeness.overallScore < 30, 'Empty family completeness score is < 30%');
    assert(emptyTwin.metadata.completeness.status === 'INSUFFICIENT_DATA', 'Empty family has status INSUFFICIENT_DATA');
  } catch (err: any) {
    assert(false, `Empty family test failed: ${err.message}`);
  } finally {
    if (testFamilyId) {
      db.prepare('DELETE FROM families WHERE id = ?').run(testFamilyId);
    }
  }

  // Test 5: Inactive Policy Filtering
  try {
    // Check that lapsed/inactive policies are excluded from active term cover
    const policies = db.prepare('SELECT * FROM insurance_policies WHERE family_id = ?').all(targetFamilyId) as any[];
    const activeSum = policies
      .filter(p => p.status === 'ACTIVE' && (p.policy_type === 'TERM' || p.policy_type === 'LIFE'))
      .reduce((sum, p) => sum + (Number(p.sum_assured) || 0), 0);

    const twin = await digitalTwinService.getDigitalTwin(targetFamilyId);
    assert(twin.state.protection.activeTermCover === activeSum, 'Protection shield strictly filters for active term policies');
  } catch (err: any) {
    assert(false, `Policy filtering test failed: ${err.message}`);
  }

  // Test 6: Knowledge Graph Federation
  try {
    const twin = await digitalTwinService.getDigitalTwin(targetFamilyId);
    assert(Array.isArray(twin.state.lineage.relationships), 'Knowledge graph relationships are returned as array');
  } catch (err: any) {
    assert(false, `Knowledge Graph federation failed: ${err.message}`);
  }

  // Test 7: Sanitized Fiduciary Audit Logging & Zero PII Leakage
  try {
    const twin = await digitalTwinService.getDigitalTwin(targetFamilyId);
    const auditRow = db.prepare(`
      SELECT * FROM ai_audit_trail 
      WHERE question LIKE '%DIGITAL_TWIN_HYDRATED%'
      ORDER BY id DESC LIMIT 1
    `).get() as any;

    assert(auditRow !== undefined, 'DIGITAL_TWIN_HYDRATED audit event is logged in ai_audit_trail');
    if (auditRow) {
      const payload = JSON.parse(auditRow.execution_result);
      assert(payload.stateHash !== undefined, 'Audit payload includes stateHash');
      assert(payload.completenessScore !== undefined, 'Audit payload includes completenessScore');
      assert(payload.grossAssets === undefined, 'Audit payload does NOT contain sensitive grossAssets figure');
      assert(payload.netWorth === undefined, 'Audit payload does NOT contain sensitive netWorth figure');
    }
  } catch (err: any) {
    assert(false, `Sanitized audit test failed: ${err.message}`);
  }

  // Test 8: Non-existent Family Rejection
  try {
    await digitalTwinService.getDigitalTwin(999999);
    assert(false, 'Non-existent family should throw NotFoundError');
  } catch (err: any) {
    assert(err.message.includes('not found') || err.statusCode === 404, 'Non-existent family correctly rejected with NotFoundError');
  }

  // Test 9: Hydration Performance Benchmark (Budget: p95 <= 500ms)
  try {
    const start = Date.now();
    await digitalTwinService.getDigitalTwin(targetFamilyId);
    const elapsed = Date.now() - start;
    assert(elapsed <= 500, `Hydration performance is fast (${elapsed}ms <= 500ms budget)`);
  } catch (err: any) {
    assert(false, `Performance benchmark failed: ${err.message}`);
  }

  console.log(`\nSprint 8B.1 Test Summary: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
