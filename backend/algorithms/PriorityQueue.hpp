#ifndef PRIORITY_QUEUE_HPP
#define PRIORITY_QUEUE_HPP

#include <vector>
#include <stdexcept>
#include <algorithm>

namespace DSA {

template <typename T, typename Compare = std::less<T>>
class PriorityQueue {
private:
    std::vector<T> heap;
    Compare comp;

    void heapifyUp(size_t index) {
        if (index == 0) return;
        size_t parent = (index - 1) / 2;
        // If child has higher priority than parent
        if (comp(heap[parent], heap[index])) {
            std::swap(heap[index], heap[parent]);
            heapifyUp(parent);
        }
    }

    void heapifyDown(size_t index) {
        size_t leftChild = 2 * index + 1;
        size_t rightChild = 2 * index + 2;
        size_t largest = index;

        if (leftChild < heap.size() && comp(heap[largest], heap[leftChild])) {
            largest = leftChild;
        }

        if (rightChild < heap.size() && comp(heap[largest], heap[rightChild])) {
            largest = rightChild;
        }

        if (largest != index) {
            std::swap(heap[index], heap[largest]);
            heapifyDown(largest);
        }
    }

public:
    PriorityQueue() = default;

    void push(const T& value) {
        heap.push_back(value);
        heapifyUp(heap.size() - 1);
    }

    void pop() {
        if (isEmpty()) {
            throw std::underflow_error("Priority Queue is empty");
        }
        std::swap(heap[0], heap[heap.size() - 1]);
        heap.pop_back();
        if (!heap.empty()) {
            heapifyDown(0);
        }
    }

    const T& top() const {
        if (isEmpty()) {
            throw std::underflow_error("Priority Queue is empty");
        }
        return heap[0];
    }

    bool isEmpty() const { return heap.empty(); }
    size_t size() const { return heap.size(); }

    void clear() {
        heap.clear();
    }

    // Convert heap to standard sorted list (destructively or by copy)
    std::vector<T> getSortedElements() const {
        PriorityQueue temp = *this;
        std::vector<T> sorted;
        while (!temp.isEmpty()) {
            sorted.push_back(temp.top());
            temp.pop();
        }
        return sorted;
    }
};

} // namespace DSA

#endif // PRIORITY_QUEUE_HPP
