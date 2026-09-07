// runtime prototype extensions, see cables/src/core/extendjs.js
// (kept import-free: this is a global script file, so these interfaces
// merge directly into the global scope without a `declare global` wrapper -
// that wrapper is only valid/needed inside a module)

interface String {
    /** append a linebreak to a string */
    endl(): string;
    /** @deprecated use string.includes */
    contains(str: string): boolean;
}

interface Math {
    randomSeed: number;
    setRandomSeed(seed: number): void;
    seededRandom(max?: number, min?: number): number;
}
