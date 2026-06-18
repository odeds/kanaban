export class PresenceManager {
  private online = new Set<string>();
  private all = new Set<string>();

  generate(hint?: string): string {
    const userId = hint && this.all.has(hint)
      ? hint
      : `user-${Math.random().toString(36).slice(2, 8)}`;
    this.online.add(userId);
    this.all.add(userId);
    return userId;
  }

  leave(userId: string): void {
    this.online.delete(userId);
  }

  getOnlineUsers(): string[] {
    return [...this.online];
  }

  getAllUsers(): string[] {
    return [...this.all];
  }
}

export const presence = new PresenceManager();
