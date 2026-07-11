#ifndef LINKED_LIST_HPP
#define LINKED_LIST_HPP

#include <stdexcept>
#include <cstddef>
#include <memory>

namespace DSA {

template <typename T>
class LinkedList {
private:
    struct Node {
        T data;
        std::shared_ptr<Node> next;
        std::weak_ptr<Node> prev; // Use weak_ptr to prevent circular dependency memory leaks

        Node(const T& val) : data(val), next(nullptr) {}
    };

    std::shared_ptr<Node> head;
    std::shared_ptr<Node> tail;
    size_t listSize;

public:
    LinkedList() : head(nullptr), tail(nullptr), listSize(0) {}
    ~LinkedList() {
        clear();
    }

    // Rule of Three / Five
    LinkedList(const LinkedList& other) : head(nullptr), tail(nullptr), listSize(0) {
        std::shared_ptr<Node> temp = other.head;
        while (temp) {
            push_back(temp->data);
            temp = temp->next;
        }
    }

    LinkedList& operator=(const LinkedList& other) {
        if (this != &other) {
            clear();
            std::shared_ptr<Node> temp = other.head;
            while (temp) {
                push_back(temp->data);
                temp = temp->next;
            }
        }
        return *this;
    }

    LinkedList(LinkedList&& other) noexcept : head(std::move(other.head)), tail(std::move(other.tail)), listSize(other.listSize) {
        other.listSize = 0;
    }

    LinkedList& operator=(LinkedList&& other) noexcept {
        if (this != &other) {
            clear();
            head = std::move(other.head);
            tail = std::move(other.tail);
            listSize = other.listSize;
            other.listSize = 0;
        }
        return *this;
    }

    void push_back(const T& val) {
        auto newNode = std::make_shared<Node>(val);
        if (!head) {
            head = newNode;
            tail = newNode;
        } else {
            newNode->prev = tail;
            tail->next = newNode;
            tail = newNode;
        }
        listSize++;
    }

    void push_front(const T& val) {
        auto newNode = std::make_shared<Node>(val);
        if (!head) {
            head = newNode;
            tail = newNode;
        } else {
            newNode->next = head;
            head->prev = newNode;
            head = newNode;
        }
        listSize++;
    }

    void pop_back() {
        if (isEmpty()) {
            throw std::underflow_error("List is empty");
        }
        if (head == tail) {
            head = nullptr;
            tail = nullptr;
        } else {
            tail = tail->prev.lock();
            tail->next = nullptr;
        }
        listSize--;
    }

    void pop_front() {
        if (isEmpty()) {
            throw std::underflow_error("List is empty");
        }
        if (head == tail) {
            head = nullptr;
            tail = nullptr;
        } else {
            head = head->next;
            head->prev.reset();
        }
        listSize--;
    }

    T& front() {
        if (isEmpty()) throw std::underflow_error("List is empty");
        return head->data;
    }

    const T& front() const {
        if (isEmpty()) throw std::underflow_error("List is empty");
        return head->data;
    }

    T& back() {
        if (isEmpty()) throw std::underflow_error("List is empty");
        return tail->data;
    }

    const T& back() const {
        if (isEmpty()) throw std::underflow_error("List is empty");
        return tail->data;
    }

    bool isEmpty() const { return listSize == 0; }
    size_t size() const { return listSize; }

    void clear() {
        while (head) {
            std::shared_ptr<Node> temp = head->next;
            head->next = nullptr;
            head->prev.reset();
            head = temp;
        }
        tail = nullptr;
        listSize = 0;
    }

    // Iterator support for STL-like loops
    class Iterator {
    private:
        std::shared_ptr<Node> current;
    public:
        Iterator(std::shared_ptr<Node> node) : current(node) {}

        T& operator*() { return current->data; }
        Iterator& operator++() {
            if (current) current = current->next;
            return *this;
        }
        bool operator!=(const Iterator& other) const { return current != other.current; }
        std::shared_ptr<Node> getNode() const { return current; }
    };

    Iterator begin() { return Iterator(head); }
    Iterator end() { return Iterator(nullptr); }

    class ConstIterator {
    private:
        std::shared_ptr<Node> current;
    public:
        ConstIterator(std::shared_ptr<Node> node) : current(node) {}

        const T& operator*() const { return current->data; }
        ConstIterator& operator++() {
            if (current) current = current->next;
            return *this;
        }
        bool operator!=(const ConstIterator& other) const { return current != other.current; }
    };

    ConstIterator begin() const { return ConstIterator(head); }
    ConstIterator end() const { return ConstIterator(nullptr); }

    // Remove a node
    void remove(Iterator it) {
        auto target = it.getNode();
        if (!target) return;

        if (target == head) {
            pop_front();
        } else if (target == tail) {
            pop_back();
        } else {
            auto prevNode = target->prev.lock();
            auto nextNode = target->next;
            if (prevNode) prevNode->next = nextNode;
            if (nextNode) nextNode->prev = prevNode;
            listSize--;
        }
    }
};

} // namespace DSA

#endif // LINKED_LIST_HPP
