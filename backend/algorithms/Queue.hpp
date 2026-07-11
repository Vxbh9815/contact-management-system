#ifndef QUEUE_HPP
#define QUEUE_HPP

#include <stdexcept>
#include <memory>

namespace DSA {

template <typename T>
class Queue {
private:
    struct Node {
        T data;
        std::shared_ptr<Node> next;
        Node(const T& val) : data(val), next(nullptr) {}
    };

    std::shared_ptr<Node> head;
    std::shared_ptr<Node> tail;
    size_t queueSize;

public:
    Queue() : head(nullptr), tail(nullptr), queueSize(0) {}
    ~Queue() { clear(); }

    void enqueue(const T& val) {
        auto newNode = std::make_shared<Node>(val);
        if (!head) {
            head = newNode;
            tail = newNode;
        } else {
            tail->next = newNode;
            tail = newNode;
        }
        queueSize++;
    }

    void dequeue() {
        if (isEmpty()) {
            throw std::underflow_error("Queue is empty");
        }
        head = head->next;
        if (!head) {
            tail = nullptr;
        }
        queueSize--;
    }

    T& front() {
        if (isEmpty()) {
            throw std::underflow_error("Queue is empty");
        }
        return head->data;
    }

    const T& front() const {
        if (isEmpty()) {
            throw std::underflow_error("Queue is empty");
        }
        return head->data;
    }

    bool isEmpty() const { return queueSize == 0; }
    size_t size() const { return queueSize; }

    void clear() {
        head = nullptr;
        tail = nullptr;
        queueSize = 0;
    }
};

} // namespace DSA

#endif // QUEUE_HPP
