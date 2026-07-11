#ifndef CONTACT_SERVICE_HPP
#define CONTACT_SERVICE_HPP

#include <vector>
#include <string>
#include <memory>
#include <algorithm>
#include <stdexcept>
#include <sstream>
#include <fstream>
#include <chrono>
#include <iomanip>

#include "../models/Contact.hpp"
#include "../algorithms/AVLTree.hpp"
#include "../algorithms/Trie.hpp"
#include "../algorithms/HashTable.hpp"
#include "../algorithms/Stack.hpp"
#include "../algorithms/Queue.hpp"
#include "../algorithms/PriorityQueue.hpp"
#include "../algorithms/Graph.hpp"
#include "../algorithms/Sorts.hpp"

namespace Services {

class ContactService {
private:
    // Core data store: we keep an active list for general indices and easy iteration
    std::vector<Models::Contact> contactsList;
    int nextId;

    // --- DSA 1: AVL Tree (Balanced BST) for alphabetical sorting of active contacts ---
    DSA::AVLTree<std::string, Models::Contact> alphabeticalTree;

    // --- DSA 2: Trie for autocomplete prefix searching of contact names ---
    DSA::Trie searchTrie;

    // --- DSA 3: Hash Table for O(1) duplicate detection (Email -> ContactId, Phone -> ContactId) ---
    DSA::HashTable<std::string, int> emailLookup;
    DSA::HashTable<std::string, int> phoneLookup;

    // --- DSA 4: Stack for LIFO tracking of Recently Viewed Contacts ---
    DSA::Stack<int> recentViews;

    // --- DSA 5: Queue for FIFO queue of Deleted Contacts (supporting Undo Delete) ---
    DSA::Queue<Models::Contact> deletedUndoQueue;

    // --- DSA 6: Graph for tracking contact relationships (connecting networking networks) ---
    DSA::Graph<Models::Contact> relationshipsGraph;

    // Helper to get current ISO timestamp
    std::string getCurrentTimestamp() const {
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %X");
        return ss.str();
    }

public:
    ContactService() : nextId(1) {}

    // Add a contact (Duplicate detection via Hash Table)
    Models::Contact addContact(const std::string& name, const std::vector<std::string>& emails,
                              const std::vector<std::string>& phones, const std::string& company = "",
                              const std::string& address = "", const std::string& birthday = "",
                              const std::vector<std::string>& tags = {}, const std::vector<std::string>& groups = {},
                              const std::string& notes = "", bool isFavorite = false) {
        
        // 1. Duplicate detection check using O(1) Hash Table lookup
        for (const auto& email : emails) {
            if (emailLookup.contains(email)) {
                throw std::invalid_argument("A contact with email '" + email + "' already exists!");
            }
        }
        for (const auto& phone : phones) {
            if (phoneLookup.contains(phone)) {
                throw std::invalid_argument("A contact with phone '" + phone + "' already exists!");
            }
        }

        // 2. Instantiate and assign new Contact ID
        int id = nextId++;
        std::string nowStr = getCurrentTimestamp();
        Models::Contact newContact(id, name, emails, phones, company, address, birthday, tags, groups, notes, isFavorite, nowStr, nowStr, 0);

        // 3. Store in physical sequential vector
        contactsList.push_back(newContact);

        // 4. Index in AVL Tree (ordered by lowercase name for balanced tree traversal)
        alphabeticalTree.insert(toLowerCase(name) + "_" + std::to_string(id), newContact);

        // 5. Index in Trie for Prefix Autocomplete searching
        searchTrie.insert(name, id);

        // 6. Index in Duplicate Detection Hash Tables
        for (const auto& email : emails) {
            emailLookup.insert(email, id);
        }
        for (const auto& phone : phones) {
            phoneLookup.insert(phone, id);
        }

        // 7. Add to Relationships Graph as a vertex
        relationshipsGraph.addVertex(id, newContact);

        // 8. Connect to contacts in the same groups
        for (const auto& contact : contactsList) {
            if (contact.id != id) {
                // Find overlapping groups
                for (const auto& grp : groups) {
                    if (std::find(contact.groups.begin(), contact.groups.end(), grp) != contact.groups.end()) {
                        relationshipsGraph.addEdge(id, contact.id, true);
                        break;
                    }
                }
            }
        }

        return newContact;
    }

    // Get contact by ID (LIFO Stack push for Recently Viewed tracking)
    Models::Contact getContactById(int id) {
        auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
            return c.id == id;
        });

        if (it == contactsList.end()) {
            throw std::runtime_error("Contact not found!");
        }

        // Increment interactions for priority rankings
        it->interactionCount++;

        // Track Recently Viewed contact in LIFO stack
        recentViews.push(id);

        return *it;
    }

    // Update Contact details
    Models::Contact updateContact(int id, const std::string& name, const std::vector<std::string>& emails,
                                 const std::vector<std::string>& phones, const std::string& company,
                                 const std::string& address, const std::string& birthday,
                                 const std::vector<std::string>& tags, const std::vector<std::string>& groups,
                                 const std::string& notes, bool isFavorite) {
        
        auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
            return c.id == id;
        });

        if (it == contactsList.end()) {
            throw std::runtime_error("Contact not found!");
        }

        // 1. Validate duplicates on updated emails/phones that don't belong to the current contact
        for (const auto& email : emails) {
            int* existingId = emailLookup.get(email);
            if (existingId && *existingId != id) {
                throw std::invalid_argument("Another contact with email '" + email + "' already exists!");
            }
        }
        for (const auto& phone : phones) {
            int* existingId = phoneLookup.get(phone);
            if (existingId && *existingId != id) {
                throw std::invalid_argument("Another contact with phone '" + phone + "' already exists!");
            }
        }

        // 2. Clean up old indexes before updating values
        // Remove from AVL Tree
        alphabeticalTree.remove(toLowerCase(it->name) + "_" + std::to_string(id));
        // Remove from Trie
        searchTrie.remove(it->name, id);
        // Remove old emails/phones from Hash Map
        for (const auto& email : it->emails) {
            emailLookup.remove(email);
        }
        for (const auto& phone : it->phoneNumbers) {
            phoneLookup.remove(phone);
        }

        // 3. Update the fields
        it->name = name;
        it->emails = emails;
        it->phoneNumbers = phones;
        it->company = company;
        it->address = address;
        it->birthday = birthday;
        it->tags = tags;
        it->groups = groups;
        it->notes = notes;
        it->isFavorite = isFavorite;
        it->lastModified = getCurrentTimestamp();

        // 4. Re-index in AVL Tree, Trie, Hash Tables
        alphabeticalTree.insert(toLowerCase(name) + "_" + std::to_string(id), *it);
        searchTrie.insert(name, id);
        for (const auto& email : emails) {
            emailLookup.insert(email, id);
        }
        for (const auto& phone : phones) {
            phoneLookup.insert(phone, id);
        }

        // 5. Update graph vertex data and adjust connections
        relationshipsGraph.addVertex(id, *it);
        // Adjust edges based on groups
        for (const auto& contact : contactsList) {
            if (contact.id != id) {
                bool sharesGroup = false;
                for (const auto& grp : groups) {
                    if (std::find(contact.groups.begin(), contact.groups.end(), grp) != contact.groups.end()) {
                        sharesGroup = true;
                        break;
                    }
                }
                if (sharesGroup) {
                    relationshipsGraph.addEdge(id, contact.id, true);
                } else {
                    relationshipsGraph.removeEdge(id, contact.id, true);
                }
            }
        }

        return *it;
    }

    // Delete contact (Enqueue in deleted queue to support Undo Delete)
    bool deleteContact(int id) {
        auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
            return c.id == id;
        });

        if (it == contactsList.end()) {
            return false;
        }

        // 1. Enqueue to deleted FIFO list (Max undo limit 10, discard old ones)
        if (deletedUndoQueue.size() >= 10) {
            deletedUndoQueue.dequeue();
        }
        deletedUndoQueue.enqueue(*it);

        // 2. Remove from AVL Tree, Trie, Hash Tables, and Graph
        alphabeticalTree.remove(toLowerCase(it->name) + "_" + std::to_string(id));
        searchTrie.remove(it->name, id);
        for (const auto& email : it->emails) {
            emailLookup.remove(email);
        }
        for (const auto& phone : it->phoneNumbers) {
            phoneLookup.remove(phone);
        }
        relationshipsGraph.removeVertex(id);

        // 3. Remove from local list
        contactsList.erase(it);
        return true;
    }

    // Undo delete contact (Pop from FIFO Queue)
    Models::Contact undoDelete() {
        if (deletedUndoQueue.isEmpty()) {
            throw std::underflow_error("No deleted contacts to restore!");
        }

        Models::Contact restored = deletedUndoQueue.front();
        deletedUndoQueue.dequeue();

        // Re-insert contact back into active status
        contactsList.push_back(restored);

        alphabeticalTree.insert(toLowerCase(restored.name) + "_" + std::to_string(restored.id), restored);
        searchTrie.insert(restored.name, restored.id);
        for (const auto& email : restored.emails) {
            emailLookup.insert(email, restored.id);
        }
        for (const auto& phone : restored.phoneNumbers) {
            phoneLookup.insert(phone, restored.id);
        }

        relationshipsGraph.addVertex(restored.id, restored);
        for (const auto& contact : contactsList) {
            if (contact.id != restored.id) {
                for (const auto& grp : restored.groups) {
                    if (std::find(contact.groups.begin(), contact.groups.end(), grp) != contact.groups.end()) {
                        relationshipsGraph.addEdge(restored.id, contact.id, true);
                        break;
                    }
                }
            }
        }

        return restored;
    }

    // Toggle contact favorite state
    bool toggleFavorite(int id) {
        auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
            return c.id == id;
        });

        if (it == contactsList.end()) return false;
        it->isFavorite = !it->isFavorite;
        it->lastModified = getCurrentTimestamp();

        // Re-index in AVL Tree
        alphabeticalTree.insert(toLowerCase(it->name) + "_" + std::to_string(id), *it);
        return true;
    }

    // Autocomplete/Prefix Search (via Trie prefix lookup)
    std::vector<Models::Contact> searchByPrefix(const std::string& prefix) const {
        std::vector<int> matchingIds = searchTrie.searchPrefix(prefix);
        std::vector<Models::Contact> results;

        for (int id : matchingIds) {
            auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
                return c.id == id;
            });
            if (it != contactsList.end()) {
                results.push_back(*it);
            }
        }
        return results;
    }

    // Get ordered contacts (In-Order AVL Tree traversal -> O(N))
    std::vector<Models::Contact> getAlphabeticalContacts() const {
        return alphabeticalTree.getInOrderValues();
    }

    // Sort contacts dynamically (using Merge Sort manually)
    std::vector<Models::Contact> getSortedContacts(const std::string& sortBy) {
        std::vector<Models::Contact> sortedList = contactsList;

        if (sortBy == "name") {
            DSA::mergeSort(sortedList, [](const Models::Contact& a, const Models::Contact& b) {
                return toLowerCase(a.name) < toLowerCase(b.name);
            });
        } else if (sortBy == "company") {
            DSA::mergeSort(sortedList, [](const Models::Contact& a, const Models::Contact& b) {
                return toLowerCase(a.company) < toLowerCase(b.company);
            });
        } else if (sortBy == "birthday") {
            DSA::mergeSort(sortedList, [](const Models::Contact& a, const Models::Contact& b) {
                if (a.birthday.empty()) return false;
                if (b.birthday.empty()) return true;
                return a.birthday < b.birthday;
            });
        } else if (sortBy == "dateAdded") {
            DSA::mergeSort(sortedList, [](const Models::Contact& a, const Models::Contact& b) {
                return a.dateAdded > b.dateAdded; // Newest first
            });
        } else if (sortBy == "lastModified") {
            DSA::mergeSort(sortedList, [](const Models::Contact& a, const Models::Contact& b) {
                return a.lastModified > b.lastModified; // Recently updated first
            });
        }

        return sortedList;
    }

    // Favorites retrieval (via Binary Max-Heap Priority Queue)
    std::vector<Models::Contact> getFavoriteContacts() const {
        // Compare functor for Priority Queue: interaction count max heap
        auto comp = [](const Models::Contact& a, const Models::Contact& b) {
            return a.interactionCount < b.interactionCount; // highest interaction first
        };
        
        DSA::PriorityQueue<Models::Contact, decltype(comp)> favPQ(comp);
        for (const auto& c : contactsList) {
            if (c.isFavorite) {
                favPQ.push(c);
            }
        }
        return favPQ.getSortedElements();
    }

    // Get recently viewed contacts (using Stack)
    std::vector<Models::Contact> getRecentlyViewed(size_t limit = 5) {
        DSA::Stack<int> tempStack = recentViews;
        std::vector<Models::Contact> recent;
        std::vector<int> addedIds;

        while (!tempStack.isEmpty() && recent.size() < limit) {
            int id = tempStack.top();
            tempStack.pop();

            if (std::find(addedIds.begin(), addedIds.end(), id) == addedIds.end()) {
                auto it = std::find_if(contactsList.begin(), contactsList.end(), [id](const Models::Contact& c) {
                    return c.id == id;
                });
                if (it != contactsList.end()) {
                    recent.push_back(*it);
                    addedIds.push_back(id);
                }
            }
        }
        return recent;
    }

    // Graph degree connection lookup (BFS exploration of contact relations)
    std::vector<Models::Contact> getRelatedContacts(int startId) const {
        std::vector<int> matchingIds = relationshipsGraph.bfs(startId);
        std::vector<Models::Contact> related;

        for (int id : matchingIds) {
            if (id != startId) {
                const auto* val = relationshipsGraph.getNodeValue(id);
                if (val) {
                    related.push_back(*val);
                }
            }
        }
        return related;
    }

    // CSV import
    int importCSV(const std::string& csvContent) {
        std::stringstream ss(csvContent);
        std::string line;
        int count = 0;

        // Skip header if present
        if (std::getline(ss, line)) {
            if (line.find("name") == std::string::npos && line.find("Name") == std::string::npos) {
                // Not a header line, parse it!
                parseCSVLine(line);
                count++;
            }
        }

        while (std::getline(ss, line)) {
            if (line.empty()) continue;
            try {
                parseCSVLine(line);
                count++;
            } catch (...) {
                // Ignore parsing errors for individual lines in robust import
            }
        }
        return count;
    }

    // Export CSV
    std::string exportCSV() const {
        std::stringstream ss;
        ss << "id,name,emails,phoneNumbers,company,address,birthday,tags,groups,notes,isFavorite,dateAdded,lastModified,interactionCount\n";
        for (const auto& c : contactsList) {
            ss << c.toCSV() << "\n";
        }
        return ss.str();
    }

    // Diagnostics / Analytics
    std::unordered_map<std::string, double> getAnalytics() const {
        std::unordered_map<std::string, double> analytics;
        analytics["totalContacts"] = static_cast<double>(contactsList.size());

        double favorites = 0;
        std::unordered_map<std::string, int> companyCounts;
        for (const auto& c : contactsList) {
            if (c.isFavorite) favorites++;
            if (!c.company.empty()) {
                companyCounts[c.company]++;
            }
        }

        analytics["favoritePercentage"] = contactsList.empty() ? 0.0 : (favorites / contactsList.size()) * 100.0;
        analytics["uniqueCompanies"] = static_cast<double>(companyCounts.size());
        analytics["undoQueueSize"] = static_cast<double>(deletedUndoQueue.size());

        return analytics;
    }

    std::vector<Models::Contact> getAllContacts() const {
        return contactsList;
    }

private:
    std::string toLowerCase(const std::string& str) const {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), ::tolower);
        return result;
    }

    std::vector<std::string> splitString(const std::string& str, char delim) const {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        while (std::getline(ss, token, delim)) {
            if (!token.empty()) tokens.push_back(token);
        }
        return tokens;
    }

    void parseCSVLine(const std::string& line) {
        std::vector<std::string> fields;
        std::stringstream ss(line);
        std::string field;
        bool inQuotes = false;

        for (char c : line) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.push_back(field);
                field.clear();
            } else {
                field += c;
            }
        }
        fields.push_back(field);

        if (fields.size() < 2) return;

        // Strip quotes
        for (auto& f : fields) {
            if (!f.empty() && f.front() == '"' && f.back() == '"') {
                f = f.substr(1, f.length() - 2);
            }
        }

        std::string name = fields[0];
        std::vector<std::string> emails = fields.size() > 1 ? splitString(fields[1], ';') : std::vector<std::string>();
        std::vector<std::string> phones = fields.size() > 2 ? splitString(fields[2], ';') : std::vector<std::string>();
        std::string company = fields.size() > 3 ? fields[3] : "";
        std::string address = fields.size() > 4 ? fields[4] : "";
        std::string birthday = fields.size() > 5 ? fields[5] : "";
        std::vector<std::string> tags = fields.size() > 6 ? splitString(fields[6], ';') : std::vector<std::string>();
        std::vector<std::string> groups = fields.size() > 7 ? splitString(fields[7], ';') : std::vector<std::string>();
        std::string notes = fields.size() > 8 ? fields[8] : "";
        bool isFavorite = fields.size() > 9 ? (fields[9] == "1" || fields[9] == "true") : false;

        addContact(name, emails, phones, company, address, birthday, tags, groups, notes, isFavorite);
    }
};

} // namespace Services

#endif // CONTACT_SERVICE_HPP
