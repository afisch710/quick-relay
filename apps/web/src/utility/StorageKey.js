// src/utility/StorageKey.js
export class StorageKey {
    constructor(feature, key) {
        this.feature = feature;
        this.key = key;
    }

    toString() {
        return `${this.feature}/${this.key}`;
    }
}