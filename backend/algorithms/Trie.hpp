#ifndef TRIE_HPP
#define TRIE_HPP

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <algorithm>

namespace DSA {

class Trie {
private:
    struct TrieNode {
        bool isEndOfWord;
        std::vector<int> contactIds; // Store IDs of contacts whose names complete here
        std::unordered_map<char, std::unique_ptr<TrieNode>> children;

        TrieNode() : isEndOfWord(false) {}
    };

    std::unique_ptr<TrieNode> root;

    // Helper method for recursive autocomplete search
    void collectAllWords(const TrieNode* currNode, std::vector<int>& resultIds) const {
        if (!currNode) return;

        if (currNode->isEndOfWord) {
            for (int id : currNode->contactIds) {
                if (std::find(resultIds.begin(), resultIds.end(), id) == resultIds.end()) {
                    resultIds.push_back(id);
                }
            }
        }

        for (const auto& pair : currNode->children) {
            collectAllWords(pair.second.get(), resultIds);
        }
    }

    std::string toLowerCase(const std::string& str) const {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), ::tolower);
        return result;
    }

public:
    Trie() : root(std::make_unique<TrieNode>()) {}

    void insert(const std::string& word, int contactId) {
        std::string normalized = toLowerCase(word);
        TrieNode* current = root.get();

        for (char ch : normalized) {
            if (current->children.find(ch) == current->children.end()) {
                current->children[ch] = std::make_unique<TrieNode>();
            }
            current = current->children[ch].get();
        }
        current->isEndOfWord = true;
        
        // Append contact ID if not already present
        if (std::find(current->contactIds.begin(), current->contactIds.end(), contactId) == current->contactIds.end()) {
            current->contactIds.push_back(contactId);
        }
    }

    // Search for contacts matching exactly
    std::vector<int> searchExact(const std::string& word) const {
        std::string normalized = toLowerCase(word);
        const TrieNode* current = root.get();

        for (char ch : normalized) {
            if (current->children.find(ch) == current->children.end()) {
                return {};
            }
            current = current->children.at(ch).get();
        }

        if (current->isEndOfWord) {
            return current->contactIds;
        }
        return {};
    }

    // Autocomplete: find all contact IDs with given prefix
    std::vector<int> searchPrefix(const std::string& prefix) const {
        std::string normalized = toLowerCase(prefix);
        const TrieNode* current = root.get();

        for (char ch : normalized) {
            if (current->children.find(ch) == current->children.end()) {
                return {};
            }
            current = current->children.at(ch).get();
        }

        std::vector<int> results;
        collectAllWords(current, results);
        return results;
    }

    void remove(const std::string& word, int contactId) {
        std::string normalized = toLowerCase(word);
        removeHelper(root.get(), normalized, 0, contactId);
    }

private:
    bool removeHelper(TrieNode* current, const std::string& word, size_t depth, int contactId) {
        if (!current) return false;

        // If end of word is reached
        if (depth == word.length()) {
            if (current->isEndOfWord) {
                // Remove the contact ID
                auto it = std::remove(current->contactIds.begin(), current->contactIds.end(), contactId);
                current->contactIds.erase(it, current->contactIds.end());

                if (current->contactIds.empty()) {
                    current->isEndOfWord = false;
                }
            }
            return current->children.empty() && !current->isEndOfWord;
        }

        char ch = word[depth];
        if (current->children.find(ch) == current->children.end()) {
            return false;
        }

        bool shouldDeleteChild = removeHelper(current->children[ch].get(), word, depth + 1, contactId);

        if (shouldDeleteChild) {
            current->children.erase(ch);
            return current->children.empty() && !current->isEndOfWord;
        }

        return false;
    }
};

} // namespace DSA

#endif // TRIE_HPP
