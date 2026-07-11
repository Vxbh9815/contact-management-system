#ifndef GRAPH_HPP
#define GRAPH_HPP

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>
#include "Queue.hpp"
#include "Stack.hpp"

namespace DSA {

template <typename T>
class Graph {
private:
    // Adjacency list: ContactId -> List of adjacent ContactIds
    std::unordered_map<int, std::vector<int>> adjList;
    // Map ID to custom node/contact details
    std::unordered_map<int, T> nodeData;

public:
    Graph() = default;

    void addVertex(int id, const T& data) {
        if (adjList.find(id) == adjList.end()) {
            adjList[id] = std::vector<int>();
        }
        nodeData[id] = data;
    }

    void addEdge(int srcId, int destId, bool bidirectional = true) {
        // Ensure vertices exist
        if (adjList.find(srcId) != adjList.end() && adjList.find(destId) != adjList.end()) {
            // Check for duplicates
            auto& neighbors = adjList[srcId];
            if (std::find(neighbors.begin(), neighbors.end(), destId) == neighbors.end()) {
                neighbors.push_back(destId);
            }
            if (bidirectional) {
                auto& revNeighbors = adjList[destId];
                if (std::find(revNeighbors.begin(), revNeighbors.end(), srcId) == revNeighbors.end()) {
                    revNeighbors.push_back(srcId);
                }
            }
        }
    }

    void removeVertex(int id) {
        adjList.erase(id);
        nodeData.erase(id);
        for (auto& pair : adjList) {
            auto& neighbors = pair.second;
            auto it = std::remove(neighbors.begin(), neighbors.end(), id);
            neighbors.erase(it, neighbors.end());
        }
    }

    void removeEdge(int srcId, int destId, bool bidirectional = true) {
        if (adjList.find(srcId) != adjList.end()) {
            auto& neighbors = adjList[srcId];
            auto it = std::remove(neighbors.begin(), neighbors.end(), destId);
            neighbors.erase(it, neighbors.end());
        }
        if (bidirectional && adjList.find(destId) != adjList.end()) {
            auto& neighbors = adjList[destId];
            auto it = std::remove(neighbors.begin(), neighbors.end(), srcId);
            neighbors.erase(it, neighbors.end());
        }
    }

    // Manual BFS traversal starting from a node
    std::vector<int> bfs(int startId) const {
        std::vector<int> traversed;
        if (adjList.find(startId) == adjList.end()) return traversed;

        std::unordered_set<int> visited;
        DSA::Queue<int> q;

        q.enqueue(startId);
        visited.insert(startId);

        while (!q.isEmpty()) {
            int current = q.front();
            q.dequeue();
            traversed.push_back(current);

            if (adjList.find(current) != adjList.end()) {
                for (int neighbor : adjList.at(current)) {
                    if (visited.find(neighbor) == visited.end()) {
                        visited.insert(neighbor);
                        q.enqueue(neighbor);
                    }
                }
            }
        }
        return traversed;
    }

    // Manual DFS traversal starting from a node
    std::vector<int> dfs(int startId) const {
        std::vector<int> traversed;
        if (adjList.find(startId) == adjList.end()) return traversed;

        std::unordered_set<int> visited;
        DSA::Stack<int> s;

        s.push(startId);

        while (!s.isEmpty()) {
            int current = s.top();
            s.pop();

            if (visited.find(current) == visited.end()) {
                visited.insert(current);
                traversed.push_back(current);

                if (adjList.find(current) != adjList.end()) {
                    // Push neighbors in reverse order to visit them in left-to-right order
                    const auto& neighbors = adjList.at(current);
                    for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it) {
                        if (visited.find(*it) == visited.end()) {
                            s.push(*it);
                        }
                    }
                }
            }
        }
        return traversed;
    }

    const T* getNodeValue(int id) const {
        auto it = nodeData.find(id);
        if (it != nodeData.end()) {
            return &(it->second);
        }
        return nullptr;
    }

    std::vector<int> getNeighbors(int id) const {
        auto it = adjList.find(id);
        if (it != adjList.end()) {
            return it->second;
        }
        return {};
    }

    std::vector<int> getVertices() const {
        std::vector<int> vertices;
        for (const auto& pair : adjList) {
            vertices.push_back(pair.first);
        }
        return vertices;
    }

    void clear() {
        adjList.clear();
        nodeData.clear();
    }
};

} // namespace DSA

#endif // GRAPH_HPP
