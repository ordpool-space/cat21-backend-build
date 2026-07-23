"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LruMap = void 0;
class LruMap {
    constructor(maxSize, options) {
        this.maxSize = maxSize;
        this.map = new Map();
        this.onEvict = options?.onEvict;
        this.isPinned = options?.isPinned;
    }
    get size() {
        return this.map.size;
    }
    get(key) {
        const value = this.map.get(key);
        if (value !== undefined) {
            this.map.delete(key);
            this.map.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (this.map.has(key)) {
            const oldValue = this.map.get(key);
            if (this.onEvict) {
                this.onEvict(key, oldValue);
            }
            this.map.delete(key);
        }
        else {
            this.evictIfFull();
        }
        this.map.set(key, value);
    }
    has(key) {
        return this.map.has(key);
    }
    delete(key) {
        const value = this.map.get(key);
        if (value !== undefined && this.onEvict) {
            this.onEvict(key, value);
        }
        return this.map.delete(key);
    }
    clear() {
        this.map.clear();
    }
    setMaxSize(newMax) {
        this.maxSize = newMax;
        while (this.map.size > this.maxSize) {
            this.evictOldest();
        }
    }
    getMaxSize() {
        return this.maxSize;
    }
    evictIfFull() {
        if (this.map.size >= this.maxSize) {
            this.evictOldest();
        }
    }
    evictOldest() {
        if (this.isPinned) {
            for (const key of this.map.keys()) {
                if (this.isPinned(key))
                    continue;
                if (this.onEvict) {
                    this.onEvict(key, this.map.get(key));
                }
                this.map.delete(key);
                return;
            }
        }
        const oldest = this.map.keys().next().value;
        if (oldest !== undefined) {
            if (this.onEvict) {
                this.onEvict(oldest, this.map.get(oldest));
            }
            this.map.delete(oldest);
        }
    }
}
exports.LruMap = LruMap;
//# sourceMappingURL=lru-map.js.map