import { db } from "../db";
export const audit = (adminId: string | undefined, action: string, entity: string, entityId?: string, meta?: object) =>
  db.auditLog.create({ data: { adminId, action, entity, entityId, meta: meta as any } }).catch(() => undefined);
