import { describe, it, expect, beforeEach } from 'vitest';
import { PresenceManager } from '../presence';

describe('PresenceManager', () => {
  let p: PresenceManager;
  beforeEach(() => { p = new PresenceManager(); });

  describe('generate (no hint)', () => {
    it('returns a user-* id', () => {
      expect(p.generate()).toMatch(/^user-/);
    });

    it('adds the user to online and all-time lists', () => {
      const id = p.generate();
      expect(p.getOnlineUsers()).toContain(id);
      expect(p.getAllUsers()).toContain(id);
    });

    it('generates unique ids across calls', () => {
      const ids = Array.from({ length: 20 }, () => p.generate());
      expect(new Set(ids).size).toBe(20);
    });
  });

  describe('generate (with hint)', () => {
    it('reuses a known userId', () => {
      const id = p.generate();
      p.leave(id);
      const resumed = p.generate(id);
      expect(resumed).toBe(id);
    });

    it('re-adds a returning user to online', () => {
      const id = p.generate();
      p.leave(id);
      expect(p.getOnlineUsers()).not.toContain(id);
      p.generate(id);
      expect(p.getOnlineUsers()).toContain(id);
    });

    it('generates a fresh id when the hint is unknown', () => {
      const fresh = p.generate('user-unknown');
      expect(fresh).not.toBe('user-unknown');
    });

    it('does not grow the all-time list when a known user resumes', () => {
      const id = p.generate();
      p.leave(id);
      p.generate(id);
      expect(p.getAllUsers()).toHaveLength(1);
    });
  });

  describe('leave', () => {
    it('removes the user from online but keeps them in all-time', () => {
      const id = p.generate();
      p.leave(id);
      expect(p.getOnlineUsers()).not.toContain(id);
      expect(p.getAllUsers()).toContain(id);
    });
  });
});
