import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration007: Migration = {
  version: 7,
  name: '007_knowledge_graph',
  up: (db: Database.Database) => {
    // 1. Relationship Types Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS relationship_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('FAMILY', 'OWNERSHIP', 'INSURANCE', 'TAX', 'ACCOUNT', 'DOCUMENT', 'ESTATE')),
        inverse_code TEXT,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Graph Nodes Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('PERSON', 'ASSET', 'POLICY', 'ACCOUNT', 'DOCUMENT', 'TAX_PROFILE')),
        entity_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        UNIQUE(family_id, entity_type, entity_id)
      )
    `).run();

    // 3. Graph Edges Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        source_node_id INTEGER NOT NULL,
        target_node_id INTEGER NOT NULL,
        relationship_type_id INTEGER NOT NULL,
        weight REAL NOT NULL DEFAULT 1.0,
        effective_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        effective_to TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (source_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (relationship_type_id) REFERENCES relationship_types(id) ON DELETE CASCADE
      )
    `).run();

    // 4. Entity References Mapping Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS entity_references (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        node_id INTEGER NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Graph Metadata Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS graph_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL UNIQUE,
        version TEXT NOT NULL DEFAULT '1.0.0',
        last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // Indices for High-Performance Traversal
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_nodes_family ON graph_nodes(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_nodes_entity ON graph_nodes(entity_type, entity_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_edges_family ON graph_edges(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_node_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_node_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_graph_edges_rel_type ON graph_edges(relationship_type_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_graph_edges_rel_type').run();
    db.prepare('DROP INDEX IF EXISTS idx_graph_edges_target').run();
    db.prepare('DROP INDEX IF EXISTS idx_graph_edges_source').run();
    db.prepare('DROP INDEX IF EXISTS idx_graph_edges_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_graph_nodes_entity').run();
    db.prepare('DROP INDEX IF EXISTS idx_graph_nodes_family').run();
    db.prepare('DROP TABLE IF EXISTS graph_metadata').run();
    db.prepare('DROP TABLE IF EXISTS entity_references').run();
    db.prepare('DROP TABLE IF EXISTS graph_edges').run();
    db.prepare('DROP TABLE IF EXISTS graph_nodes').run();
    db.prepare('DROP TABLE IF EXISTS relationship_types').run();
  }
};
