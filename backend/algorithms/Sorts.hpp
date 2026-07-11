#ifndef SORTS_HPP
#define SORTS_HPP

#include <vector>
#include <functional>

namespace DSA {

// --- MERGE SORT (Stable Sort) ---
// Time Complexity: O(N log N) in all cases (best, average, worst)
// Space Complexity: O(N) auxiliary space
// Why used: Stable sorting, preserves relative order of equal elements (e.g. secondary sorting).
template <typename T, typename Compare = std::less<T>>
void merge(std::vector<T>& arr, int left, int mid, int right, Compare comp) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    std::vector<T> L;
    L.reserve(n1);
    std::vector<T> R;
    R.reserve(n2);

    for (int i = 0; i < n1; ++i) L.push_back(arr[left + i]);
    for (int j = 0; j < n2; ++j) R.push_back(arr[mid + 1 + j]);

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (comp(L[i], R[j]) || (!comp(R[j], L[i]))) { // Stable comparison (L[i] <= R[j])
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

template <typename T, typename Compare = std::less<T>>
void mergeSortHelper(std::vector<T>& arr, int left, int right, Compare comp) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSortHelper(arr, left, mid, comp);
        mergeSortHelper(arr, mid + 1, right, comp);
        merge(arr, left, mid, right, comp);
    }
}

template <typename T, typename Compare = std::less<T>>
void mergeSort(std::vector<T>& arr, Compare comp = Compare()) {
    if (arr.empty()) return;
    mergeSortHelper(arr, 0, static_cast<int>(arr.size() - 1), comp);
}


// --- QUICK SORT (In-place Sort) ---
// Time Complexity: O(N log N) average, O(N^2) worst case (using random pivot mitigates this)
// Space Complexity: O(log N) stack space for recursion
// Why used: Extremely fast in practice, in-place sorting, no additional heap allocations.
template <typename T, typename Compare = std::less<T>>
int partition(std::vector<T>& arr, int low, int high, Compare comp) {
    // Choose the middle element as pivot (mitigates sorted array worst-case scenario)
    int pivotIdx = low + (high - low) / 2;
    std::swap(arr[pivotIdx], arr[high]);
    T pivot = arr[high];

    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (comp(arr[j], pivot)) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

template <typename T, typename Compare = std::less<T>>
void quickSortHelper(std::vector<T>& arr, int low, int high, Compare comp) {
    if (low < high) {
        int pi = partition(arr, low, high, comp);
        quickSortHelper(arr, low, pi - 1, comp);
        quickSortHelper(arr, pi + 1, high, comp);
    }
}

template <typename T, typename Compare = std::less<T>>
void quickSort(std::vector<T>& arr, Compare comp = Compare()) {
    if (arr.empty()) return;
    quickSortHelper(arr, 0, static_cast<int>(arr.size() - 1), comp);
}


// --- BINARY SEARCH ---
// Time Complexity: O(log N)
// Space Complexity: O(1)
// Why used: Blazing fast lookup in sorted lists.
template <typename T, typename Key, typename ExtractKey, typename Compare = std::less<Key>>
int binarySearch(const std::vector<T>& arr, const Key& targetKey, ExtractKey extract, Compare comp = Compare()) {
    int low = 0;
    int high = static_cast<int>(arr.size()) - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        Key midKey = extract(arr[mid]);

        if (!comp(midKey, targetKey) && !comp(targetKey, midKey)) {
            return mid; // Found
        } else if (comp(midKey, targetKey)) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1; // Not found
}

} // namespace DSA

#endif // SORTS_HPP
