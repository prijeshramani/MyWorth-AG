import { db } from '../../db';
import { CorrelationContext } from '../correlation/CorrelationContext';
import { EventEnvelope, EventEnvelopeSchema } from '../../contracts/familyOfficeContracts';

export type DomainEventHandler<T = any> = (event: EventEnvelope<T>) => Promise<void> | void;

export class AuditHookService {
  private handlers: Map<string, DomainEventHandler[]> = new Map();

  /**
   * Register a subscriber for a domain event
   */
  public subscribe<T = any>(eventType: string, handler: DomainEventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  /**
   * Publishes an event, validates contract, logs audit record, and triggers subscribers
   */
  public async publishEvent<T = any>(event: EventEnvelope<T>): Promise<void> {
    // 1. Validate envelope with Zod contract
    const validated = EventEnvelopeSchema.parse(event) as EventEnvelope<T>;

    // 2. Persist audit trail record
    const correlationId = validated.correlationId || CorrelationContext.getCorrelationId();
    
    try {
      db.prepare(`
        INSERT INTO ai_audit_trail (action_id, question, skills_used, actions_proposed, user_decision, evidence_used, execution_result)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        validated.eventId,
        `[${validated.aggregateType}] ${validated.eventType}`,
        JSON.stringify([validated.aggregateType]),
        JSON.stringify({ aggregateId: validated.aggregateId }),
        'AUDITED',
        JSON.stringify({
          correlationId,
          causationId: validated.causationId,
          familyId: validated.familyId,
          version: validated.version
        }),
        JSON.stringify(validated.payload)
      );
    } catch (err) {
      console.warn('[AuditHookService] Failed to write audit trail record:', err);
    }

    // 3. Dispatch to registered in-process listeners asynchronously
    const eventHandlers = this.handlers.get(validated.eventType) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...eventHandlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(validated);
      } catch (err) {
        console.error(`[AuditHookService] Error in handler for event ${validated.eventType}:`, err);
      }
    }
  }

  /**
   * Helper to create and publish a standard event with context correlation ID
   */
  public async createAndPublishEvent<T = any>(params: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    familyId: number;
    payload: T;
    causationId?: string;
  }): Promise<EventEnvelope<T>> {
    const event: EventEnvelope<T> = {
      eventId: CorrelationContext.generateId('evt'),
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      familyId: params.familyId,
      correlationId: CorrelationContext.getCorrelationId(),
      causationId: params.causationId || CorrelationContext.getCausationId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      payload: params.payload
    };

    await this.publishEvent(event);
    return event;
  }
}

export const auditHookService = new AuditHookService();
