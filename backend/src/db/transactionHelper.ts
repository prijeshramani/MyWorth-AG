import { db } from '../db';

export function runInTransaction<T>(fn: () => T): T {
  const transaction = db.transaction(() => {
    return fn();
  });
  return transaction();
}
