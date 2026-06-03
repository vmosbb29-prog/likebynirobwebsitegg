interface Session {
  lastSeen: Date;
  page: string;
}

const sessions = new Map<string, Session>();
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

setInterval(() => {
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
  for (const [id, session] of sessions.entries()) {
    if (session.lastSeen < cutoff) {
      sessions.delete(id);
    }
  }
}, 30_000);

export function heartbeat(sessionId: string, page: string): void {
  sessions.set(sessionId, { lastSeen: new Date(), page });
}

export function getOnlineCount(): number {
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
  let count = 0;
  for (const session of sessions.values()) {
    if (session.lastSeen >= cutoff) count++;
  }
  return count;
}

export function getOnlineByPage(): Record<string, number> {
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
  const pages: Record<string, number> = {};
  for (const session of sessions.values()) {
    if (session.lastSeen >= cutoff) {
      pages[session.page] = (pages[session.page] ?? 0) + 1;
    }
  }
  return pages;
}
