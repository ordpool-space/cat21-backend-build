export declare class LruMap<K, V> {
    private maxSize;
    private readonly map;
    private readonly onEvict?;
    private readonly isPinned?;
    constructor(maxSize: number, options?: {
        onEvict?: (key: K, value: V) => void;
        isPinned?: (key: K) => boolean;
    });
    get size(): number;
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    setMaxSize(newMax: number): void;
    getMaxSize(): number;
    private evictIfFull;
    private evictOldest;
}
