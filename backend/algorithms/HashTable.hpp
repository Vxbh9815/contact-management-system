#ifndef HASH_TABLE_HPP
#define HASH_TABLE_HPP

#include <vector>
#include <string>
#include <stdexcept>
#include <memory>
#include "LinkedList.hpp"

namespace DSA {

template <typename K, typename V>
class HashTable {
private:
    struct HashEntry {
        K key;
        V value;
        HashEntry(const K& k, const V& v) : key(k), value(v) {}
    };

    std::vector<LinkedList<HashEntry>> buckets;
    size_t numElements;
    size_t numBuckets;
    const double maxLoadFactor = 0.75;

    // Custom Polynomial Rolling Hash Function for strings
    size_t hashFunction(const std::string& key) const {
        size_t hash = 0;
        size_t prime = 31;
        for (char c : key) {
            hash = (hash * prime + c) % numBuckets;
        }
        return hash;
    }

    // Hash function fallback for numerical keys
    template <typename T>
    typename std::enable_if<std::is_arithmetic<T>::value, size_t>::type
    hashFunction(const T& key) const {
        return static_cast<size_t>(key) % numBuckets;
    }

    size_t getBucketIndex(const K& key) const {
        return hashFunction(key);
    }

    void rehash() {
        size_t oldNumBuckets = numBuckets;
        numBuckets *= 2; // Double the capacity
        std::vector<LinkedList<HashEntry>> newBuckets(numBuckets);

        for (size_t i = 0; i < oldNumBuckets; ++i) {
            for (auto it = buckets[i].begin(); it != buckets[i].end(); ++it) {
                size_t newIdx = hashFunction((*it).key);
                newBuckets[newIdx].push_back(*it);
            }
        }
        buckets = std::move(newBuckets);
    }

public:
    HashTable(size_t initialCapacity = 17) : numElements(0), numBuckets(initialCapacity) {
        buckets.resize(numBuckets);
    }

    void insert(const K& key, const V& value) {
        if ((double)numElements / numBuckets >= maxLoadFactor) {
            rehash();
        }

        size_t idx = getBucketIndex(key);
        // Check if key already exists, update if so
        for (auto it = buckets[idx].begin(); it != buckets[idx].end(); ++it) {
            if ((*it).key == key) {
                (*it).value = value;
                return;
            }
        }

        // Otherwise push new entry
        buckets[idx].push_back(HashEntry(key, value));
        numElements++;
    }

    bool remove(const K& key) {
        size_t idx = getBucketIndex(key);
        for (auto it = buckets[idx].begin(); it != buckets[idx].end(); ++it) {
            if ((*it).key == key) {
                buckets[idx].remove(it);
                numElements--;
                return true;
            }
        }
        return false;
    }

    V* get(const K& key) {
        size_t idx = getBucketIndex(key);
        for (auto it = buckets[idx].begin(); it != buckets[idx].end(); ++it) {
            if ((*it).key == key) {
                return &((*it).value);
            }
        }
        return nullptr;
    }

    const V* get(const K& key) const {
        size_t idx = getBucketIndex(key);
        for (auto it = buckets[idx].begin(); it != buckets[idx].end(); ++it) {
            if ((*it).key == key) {
                return &((*it).value);
            }
        }
        return nullptr;
    }

    bool contains(const K& key) const {
        return get(key) != nullptr;
    }

    size_t size() const { return numElements; }
    size_t bucketCount() const { return numBuckets; }
    bool isEmpty() const { return numElements == 0; }

    void clear() {
        for (size_t i = 0; i < numBuckets; ++i) {
            buckets[i].clear();
        }
        numElements = 0;
    }

    // Get all keys
    std::vector<K> keys() const {
        std::vector<K> allKeys;
        for (size_t i = 0; i < numBuckets; ++i) {
            for (auto it = buckets[i].begin(); it != buckets[i].end(); ++it) {
                allKeys.push_back((*it).key);
            }
        }
        return allKeys;
    }

    // Get all values
    std::vector<V> values() const {
        std::vector<V> allValues;
        for (size_t i = 0; i < numBuckets; ++i) {
            for (auto it = buckets[i].begin(); it != buckets[i].end(); ++it) {
                allValues.push_back((*it).value);
            }
        }
        return allValues;
    }
};

} // namespace DSA

#endif // HASH_TABLE_HPP
