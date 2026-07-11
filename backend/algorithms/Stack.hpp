#ifndef STACK_HPP
#define STACK_HPP

#include <stdexcept>
#include <memory>

namespace DSA {

template <typename T>
class Stack {
private:
    struct Node {
        T data;
        std::shared_ptr<Node> next;
        Node(const T& val) : data(val), next(nullptr) {}
    };

    std::shared_ptr<Node> topNode;
    size_t stackSize;

public:
    Stack() : topNode(nullptr), stackSize(0) {}
    ~Stack() { clear(); }

    void push(const T& val) {
        auto newNode = std::make_shared<Node>(val);
        newNode->next = topNode;
        topNode = newNode;
        stackSize++;
    }

    void pop() {
        if (isEmpty()) {
            throw std::underflow_error("Stack is empty");
        }
        topNode = topNode->next;
        stackSize--;
    }

    T& top() {
        if (isEmpty()) {
            throw std::underflow_error("Stack is empty");
        }
        return topNode->data;
    }

    const T& top() const {
        if (isEmpty()) {
            throw std::underflow_error("Stack is empty");
        }
        return topNode->data;
    }

    bool isEmpty() const { return stackSize == 0; }
    size_t size() const { return stackSize; }

    void clear() {
        topNode = nullptr;
        stackSize = 0;
    }
};

} // namespace DSA

#endif // STACK_HPP
