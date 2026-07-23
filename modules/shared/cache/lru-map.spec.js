"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lru_map_1 = require("./lru-map");
describe('LruMap', () => {
    it('should store and retrieve values', () => {
        const map = new lru_map_1.LruMap(3);
        map.set('a', 1);
        map.set('b', 2);
        expect(map.get('a')).toBe(1);
        expect(map.get('b')).toBe(2);
        expect(map.size).toBe(2);
    });
    it('should evict oldest entry when full', () => {
        const map = new lru_map_1.LruMap(2);
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);
        expect(map.get('a')).toBeUndefined();
        expect(map.get('b')).toBe(2);
        expect(map.get('c')).toBe(3);
    });
    it('should promote accessed entry to most recent', () => {
        const map = new lru_map_1.LruMap(2);
        map.set('a', 1);
        map.set('b', 2);
        map.get('a');
        map.set('c', 3);
        expect(map.get('a')).toBe(1);
        expect(map.get('b')).toBeUndefined();
        expect(map.get('c')).toBe(3);
    });
    it('should update existing key without growing', () => {
        const map = new lru_map_1.LruMap(2);
        map.set('a', 1);
        map.set('b', 2);
        map.set('a', 10);
        expect(map.size).toBe(2);
        expect(map.get('a')).toBe(10);
    });
    it('should call onEvict callback', () => {
        const evicted = [];
        const map = new lru_map_1.LruMap(2, {
            onEvict: (k, v) => evicted.push([k, v]),
        });
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);
        expect(evicted).toEqual([['a', 1]]);
    });
    it('fires onEvict on replace-in-place so secondary indexes drop the old value', () => {
        const evicted = [];
        const map = new lru_map_1.LruMap(2, {
            onEvict: (k, v) => evicted.push([k, v]),
        });
        map.set('a', 1);
        map.set('a', 2);
        expect(evicted).toEqual([['a', 1]]);
        expect(map.get('a')).toBe(2);
    });
    it('fires onEvict on explicit delete', () => {
        const evicted = [];
        const map = new lru_map_1.LruMap(3, {
            onEvict: (k, v) => evicted.push([k, v]),
        });
        map.set('a', 1);
        map.set('b', 2);
        expect(map.delete('a')).toBe(true);
        expect(evicted).toEqual([['a', 1]]);
        expect(map.delete('missing')).toBe(false);
        expect(evicted).toEqual([['a', 1]]);
    });
    it('should resize and evict when shrinking', () => {
        const map = new lru_map_1.LruMap(5);
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);
        map.set('d', 4);
        map.set('e', 5);
        map.setMaxSize(2);
        expect(map.size).toBe(2);
        expect(map.get('a')).toBeUndefined();
        expect(map.get('b')).toBeUndefined();
        expect(map.get('c')).toBeUndefined();
        expect(map.get('d')).toBe(4);
        expect(map.get('e')).toBe(5);
    });
    it('should clear all entries', () => {
        const map = new lru_map_1.LruMap(5);
        map.set('a', 1);
        map.set('b', 2);
        map.clear();
        expect(map.size).toBe(0);
        expect(map.get('a')).toBeUndefined();
    });
    it('should delete specific entry', () => {
        const map = new lru_map_1.LruMap(5);
        map.set('a', 1);
        map.set('b', 2);
        map.delete('a');
        expect(map.size).toBe(1);
        expect(map.get('a')).toBeUndefined();
        expect(map.get('b')).toBe(2);
    });
    it('should handle has() correctly', () => {
        const map = new lru_map_1.LruMap(5);
        map.set('a', 1);
        expect(map.has('a')).toBe(true);
        expect(map.has('b')).toBe(false);
    });
    it('should skip pinned entries on eviction', () => {
        const map = new lru_map_1.LruMap(3, {
            isPinned: (k) => k === 1,
        });
        map.set(1, 'pinned');
        map.set(2, 'a');
        map.set(3, 'b');
        map.set(4, 'c');
        expect(map.get(1)).toBe('pinned');
        expect(map.get(2)).toBeUndefined();
        expect(map.get(3)).toBe('b');
        expect(map.get(4)).toBe('c');
    });
    it('should pin multiple entries across the range', () => {
        const map = new lru_map_1.LruMap(3, {
            isPinned: (k) => k < 10,
        });
        map.set(1, 'a');
        map.set(2, 'b');
        map.set(20, 'c');
        map.set(30, 'd');
        expect(map.get(1)).toBe('a');
        expect(map.get(2)).toBe('b');
        expect(map.get(20)).toBeUndefined();
        expect(map.get(30)).toBe('d');
    });
    it('should fall back to oldest when all entries pinned (safety)', () => {
        const map = new lru_map_1.LruMap(2, {
            isPinned: () => true,
        });
        map.set(1, 'a');
        map.set(2, 'b');
        map.set(3, 'c');
        expect(map.get(1)).toBeUndefined();
        expect(map.get(2)).toBe('b');
        expect(map.get(3)).toBe('c');
    });
});
//# sourceMappingURL=lru-map.spec.js.map