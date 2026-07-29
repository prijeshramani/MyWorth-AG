import { db } from './db';

console.log('--- INSPECTING DEMO ASSETS & POLICIES ---');

const assets = db.prepare("SELECT * FROM assets WHERE name LIKE '%Reliance%' OR name LIKE '%Test%'").all();
console.log('Demo Assets:', assets);

const policies = db.prepare("SELECT * FROM insurance_policies WHERE policy_number LIKE '%TEST%' OR insurer_name LIKE '%Max Life%'").all();
console.log('Demo Policies:', policies);

const members = db.prepare("SELECT * FROM family_members WHERE name LIKE '%Rajesh%'").all();
console.log('Demo Members:', members);

const graphNodes = db.prepare("SELECT * FROM graph_nodes WHERE label LIKE '%Reliance%' OR label LIKE '%Rajesh%' OR label LIKE '%POL-TEST%'").all();
console.log('Demo Graph Nodes:', graphNodes.length);
