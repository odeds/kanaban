class PresenceManager {
  private users = new Set<string>();

  join(userId: string): string[] {
    this.users.add(userId);
    return [...this.users];
  }

  leave(userId: string): string[] {
    this.users.delete(userId);
    return [...this.users];
  }

  getUsers(): string[] {
    return [...this.users];
  }
}

export const presence = new PresenceManager();
