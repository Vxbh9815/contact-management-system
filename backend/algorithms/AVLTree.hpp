#ifndef AVL_TREE_HPP
#define AVL_TREE_HPP

#include <algorithm>
#include <vector>
#include <memory>
#include <string>

namespace DSA {

template <typename K, typename V>
class AVLTree {
private:
    struct Node {
        K key;
        V value;
        int height;
        std::shared_ptr<Node> left;
        std::shared_ptr<Node> right;

        Node(const K& k, const V& v) 
            : key(k), value(v), height(1), left(nullptr), right(nullptr) {}
    };

    std::shared_ptr<Node> root;
    size_t treeSize;

    int height(std::shared_ptr<Node> n) const {
        return n ? n->height : 0;
    }

    int getBalance(std::shared_ptr<Node> n) const {
        return n ? height(n->left) - height(n->right) : 0;
    }

    void updateHeight(std::shared_ptr<Node> n) {
        if (n) {
            n->height = 1 + std::max(height(n->left), height(n->right));
        }
    }

    // Right Rotate (LL case)
    std::shared_ptr<Node> rightRotate(std::shared_ptr<Node> y) {
        auto x = y->left;
        auto T2 = x->right;

        // Perform rotation
        x->right = y;
        y->left = T2;

        // Update heights
        updateHeight(y);
        updateHeight(x);

        return x; // New root
    }

    // Left Rotate (RR case)
    std::shared_ptr<Node> leftRotate(std::shared_ptr<Node> x) {
        auto y = x->right;
        auto T2 = y->left;

        // Perform rotation
        y->left = x;
        x->right = T2;

        // Update heights
        updateHeight(x);
        updateHeight(y);

        return y; // New root
    }

    std::shared_ptr<Node> insertNode(std::shared_ptr<Node> node, const K& key, const V& value) {
        // 1. Standard BST insertion
        if (!node) {
            treeSize++;
            return std::make_shared<Node>(key, value);
        }

        if (key < node->key) {
            node->left = insertNode(node->left, key, value);
        } else if (key > node->key) {
            node->right = insertNode(node->right, key, value);
        } else {
            // Equal keys, update existing value
            node->value = value;
            return node;
        }

        // 2. Update height
        updateHeight(node);

        // 3. Balance the node
        int balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && key < node->left->key) {
            return rightRotate(node);
        }

        // Right Right Case
        if (balance < -1 && key > node->right->key) {
            return leftRotate(node);
        }

        // Left Right Case
        if (balance > 1 && key > node->left->key) {
            node->left = leftRotate(node->left);
            return rightRotate(node);
        }

        // Right Left Case
        if (balance < -1 && key < node->right->key) {
            node->right = rightRotate(node->right);
            return leftRotate(node);
        }

        return node;
    }

    std::shared_ptr<Node> minValueNode(std::shared_ptr<Node> node) {
        auto current = node;
        while (current->left) {
            current = current->left;
        }
        return current;
    }

    std::shared_ptr<Node> deleteNode(std::shared_ptr<Node> node, const K& key, bool& deleted) {
        if (!node) return node;

        if (key < node->key) {
            node->left = deleteNode(node->left, key, deleted);
        } else if (key > node->key) {
            node->right = deleteNode(node->right, key, deleted);
        } else {
            // This is the node to delete
            deleted = true;
            treeSize--;

            if (!node->left || !node->right) {
                auto temp = node->left ? node->left : node->right;
                if (!temp) {
                    temp = node;
                    node = nullptr;
                } else {
                    *node = *temp; // Copy content
                }
            } else {
                auto temp = minValueNode(node->right);
                node->key = temp->key;
                node->value = temp->value;
                bool tempDeleted = false;
                node->right = deleteNode(node->right, temp->key, tempDeleted);
            }
        }

        if (!node) return node;

        updateHeight(node);

        int balance = getBalance(node);

        // Left Left Case
        if (balance > 1 && getBalance(node->left) >= 0) {
            return rightRotate(node);
        }

        // Left Right Case
        if (balance > 1 && getBalance(node->left) < 0) {
            node->left = leftRotate(node->left);
            return rightRotate(node);
        }

        // Right Right Case
        if (balance < -1 && getBalance(node->right) <= 0) {
            return leftRotate(node);
        }

        // Right Left Case
        if (balance < -1 && getBalance(node->right) > 0) {
            node->right = rightRotate(node->right);
            return leftRotate(node);
        }

        return node;
    }

    void inOrderTraversal(std::shared_ptr<Node> node, std::vector<V>& results) const {
        if (!node) return;
        inOrderTraversal(node->left, results);
        results.push_back(node->value);
        inOrderTraversal(node->right, results);
    }

    V* findNode(std::shared_ptr<Node> node, const K& key) const {
        if (!node) return nullptr;
        if (key == node->key) return const_cast<V*>(&(node->value));
        if (key < node->key) return findNode(node->left, key);
        return findNode(node->right, key);
    }

public:
    AVLTree() : root(nullptr), treeSize(0) {}

    void insert(const K& key, const V& value) {
        root = insertNode(root, key, value);
    }

    bool remove(const K& key) {
        bool deleted = false;
        root = deleteNode(root, key, deleted);
        return deleted;
    }

    V* find(const K& key) const {
        return findNode(root, key);
    }

    bool contains(const K& key) const {
        return findNode(root, key) != nullptr;
    }

    std::vector<V> getInOrderValues() const {
        std::vector<V> results;
        inOrderTraversal(root, results);
        return results;
    }

    size_t size() const { return treeSize; }
    bool isEmpty() const { return treeSize == 0; }

    void clear() {
        root = nullptr;
        treeSize = 0;
    }
};

} // namespace DSA

#endif // AVL_TREE_HPP
