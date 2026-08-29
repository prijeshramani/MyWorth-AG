import Database from 'better-sqlite3';
import { db } from '../db';
import { TimelineEventRow, TimelineQueryFilter } from '../contracts/familyOfficeContracts';

export interface CreateTimelineEventInput {
  family_id: number;
  event_id: string;
  domain: string;
  event_type: string;
  source_type: string;
  source_id: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  amount_type?: string | null;
  currency?: string;
  family_member_id?: number | null;
  event_date: string;
  importance_tier?: string;
  metadata_json?: string | null;
  state_hash?: string | null;
}

export class SQLiteFamilyTimelineRepository {
  private database: Database.Database;

  constructor(customDb?: Database.Database) {
    this.database = customDb || db;
  }

  public upsertEvent(event: CreateTimelineEventInput): TimelineEventRow {
    const stmt = this.database.prepare(`
      INSERT INTO family_timeline_events (
        family_id, event_id, domain, event_type, source_type, source_id,
        title, description, amount, amount_type, currency, family_member_id,
        event_date, importance_tier, metadata_json, state_hash,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(family_id, event_id) DO UPDATE SET
        domain = excluded.domain,
        event_type = excluded.event_type,
        source_type = excluded.source_type,
        source_id = excluded.source_id,
        title = excluded.title,
        description = excluded.description,
        amount = excluded.amount,
        amount_type = excluded.amount_type,
        currency = excluded.currency,
        family_member_id = excluded.family_member_id,
        event_date = excluded.event_date,
        importance_tier = excluded.importance_tier,
        metadata_json = excluded.metadata_json,
        state_hash = excluded.state_hash,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      event.family_id,
      event.event_id,
      event.domain,
      event.event_type,
      event.source_type,
      event.source_id,
      event.title,
      event.description || null,
      event.amount !== undefined ? event.amount : null,
      event.amount_type || null,
      event.currency || 'INR',
      event.family_member_id || null,
      event.event_date,
      event.importance_tier || 'MEDIUM',
      event.metadata_json || null,
      event.state_hash || null
    );

    return this.findByEventId(event.family_id, event.event_id)!;
  }

  public batchUpsertEvents(events: CreateTimelineEventInput[]): void {
    if (events.length === 0) return;

    const stmt = this.database.prepare(`
      INSERT INTO family_timeline_events (
        family_id, event_id, domain, event_type, source_type, source_id,
        title, description, amount, amount_type, currency, family_member_id,
        event_date, importance_tier, metadata_json, state_hash,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(family_id, event_id) DO UPDATE SET
        domain = excluded.domain,
        event_type = excluded.event_type,
        source_type = excluded.source_type,
        source_id = excluded.source_id,
        title = excluded.title,
        description = excluded.description,
        amount = excluded.amount,
        amount_type = excluded.amount_type,
        currency = excluded.currency,
        family_member_id = excluded.family_member_id,
        event_date = excluded.event_date,
        importance_tier = excluded.importance_tier,
        metadata_json = excluded.metadata_json,
        state_hash = excluded.state_hash,
        updated_at = CURRENT_TIMESTAMP
    `);

    const runBatch = this.database.transaction((items: CreateTimelineEventInput[]) => {
      for (const item of items) {
        stmt.run(
          item.family_id,
          item.event_id,
          item.domain,
          item.event_type,
          item.source_type,
          item.source_id,
          item.title,
          item.description || null,
          item.amount !== undefined ? item.amount : null,
          item.amount_type || null,
          item.currency || 'INR',
          item.family_member_id || null,
          item.event_date,
          item.importance_tier || 'MEDIUM',
          item.metadata_json || null,
          item.state_hash || null
        );
      }
    });

    runBatch(events);
  }

  public deleteByEventIds(familyId: number, eventIds: string[]): void {
    if (eventIds.length === 0) return;
    const placeholders = eventIds.map(() => '?').join(',');
    this.database.prepare(`
      DELETE FROM family_timeline_events 
      WHERE family_id = ? AND event_id IN (${placeholders})
    `).run(familyId, ...eventIds);
  }

  public getAllEventIds(familyId: number): string[] {
    const rows = this.database.prepare(`
      SELECT event_id FROM family_timeline_events
      WHERE family_id = ?
    `).all(familyId) as { event_id: string }[];
    return rows.map(r => r.event_id);
  }

  public batchReconcileTimeline(
    familyId: number,
    obsoleteEventIds: string[],
    currentEvents: CreateTimelineEventInput[]
  ): void {
    const reconcileTx = this.database.transaction(() => {
      // 1. Purge obsolete events
      if (obsoleteEventIds.length > 0) {
        const placeholders = obsoleteEventIds.map(() => '?').join(',');
        this.database.prepare(`
          DELETE FROM family_timeline_events 
          WHERE family_id = ? AND event_id IN (${placeholders})
        `).run(familyId, ...obsoleteEventIds);
      }

      // 2. Upsert current active events
      if (currentEvents.length > 0) {
        const stmt = this.database.prepare(`
          INSERT INTO family_timeline_events (
            family_id, event_id, domain, event_type, source_type, source_id,
            title, description, amount, amount_type, currency, family_member_id,
            event_date, importance_tier, metadata_json, state_hash,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT(family_id, event_id) DO UPDATE SET
            domain = excluded.domain,
            event_type = excluded.event_type,
            source_type = excluded.source_type,
            source_id = excluded.source_id,
            title = excluded.title,
            description = excluded.description,
            amount = excluded.amount,
            amount_type = excluded.amount_type,
            currency = excluded.currency,
            family_member_id = excluded.family_member_id,
            event_date = excluded.event_date,
            importance_tier = excluded.importance_tier,
            metadata_json = excluded.metadata_json,
            state_hash = excluded.state_hash,
            updated_at = CURRENT_TIMESTAMP
        `);

        for (const item of currentEvents) {
          stmt.run(
            item.family_id,
            item.event_id,
            item.domain,
            item.event_type,
            item.source_type,
            item.source_id,
            item.title,
            item.description || null,
            item.amount !== undefined ? item.amount : null,
            item.amount_type || null,
            item.currency || 'INR',
            item.family_member_id || null,
            item.event_date,
            item.importance_tier || 'MEDIUM',
            item.metadata_json || null,
            item.state_hash || null
          );
        }
      }
    });

    reconcileTx();
  }

  public findByEventId(familyId: number, eventId: string): TimelineEventRow | null {
    const row = this.database.prepare(`
      SELECT * FROM family_timeline_events 
      WHERE family_id = ? AND event_id = ?
      LIMIT 1
    `).get(familyId, eventId) as TimelineEventRow | undefined;

    return row || null;
  }

  public getTimeline(
    familyId: number,
    filter?: TimelineQueryFilter
  ): { events: TimelineEventRow[]; total: number } {
    const conditions: string[] = ['family_id = ?'];
    const params: any[] = [familyId];

    if (filter?.domain) {
      conditions.push('domain = ?');
      params.push(filter.domain);
    }

    if (filter?.familyMemberId) {
      conditions.push('family_member_id = ?');
      params.push(filter.familyMemberId);
    }

    if (filter?.startDate) {
      conditions.push('event_date >= ?');
      params.push(filter.startDate);
    }

    if (filter?.endDate) {
      conditions.push('event_date <= ?');
      params.push(filter.endDate);
    } else if (!filter?.includeScheduled) {
      // By default exclude future dates unless scheduled events requested
      conditions.push('event_date <= date(\'now\')');
    }

    if (filter?.importanceTier) {
      conditions.push('importance_tier = ?');
      params.push(filter.importanceTier);
    }

    if (filter?.minAmount !== undefined && filter?.minAmount !== null) {
      if (filter.minAmountCurrency) {
        // Currency-aware matching: matches same currency or converted INR in metadata
        conditions.push('(currency = ? AND amount >= ?)');
        params.push(filter.minAmountCurrency, filter.minAmount);
      } else {
        conditions.push('amount >= ?');
        params.push(filter.minAmount);
      }
    }

    if (filter?.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = this.database.prepare(`
      SELECT COUNT(*) as count FROM family_timeline_events 
      WHERE ${whereClause}
    `).get(...params) as { count: number };

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const events = this.database.prepare(`
      SELECT * FROM family_timeline_events 
      WHERE ${whereClause}
      ORDER BY event_date DESC, 
               CASE importance_tier 
                 WHEN 'CRITICAL' THEN 1 
                 WHEN 'HIGH' THEN 2 
                 WHEN 'MEDIUM' THEN 3 
                 ELSE 4 
               END ASC, 
               event_id ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as TimelineEventRow[];

    return {
      events,
      total: countRow.count
    };
  }

  public deleteBySource(familyId: number, sourceType: string, sourceId: string): void {
    this.database.prepare(`
      DELETE FROM family_timeline_events 
      WHERE family_id = ? AND source_type = ? AND source_id = ?
    `).run(familyId, sourceType, sourceId);
  }

  public purgeFamilyTimeline(familyId: number): void {
    this.database.prepare(`
      DELETE FROM family_timeline_events 
      WHERE family_id = ?
    `).run(familyId);
  }
}

export const familyTimelineRepository = new SQLiteFamilyTimelineRepository();
