export type AuditEvent = {
  actorId?: string | null;
  ip?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export function buildAuditEvent(input: AuditEvent): AuditEvent {
  return {
    ...input,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}
