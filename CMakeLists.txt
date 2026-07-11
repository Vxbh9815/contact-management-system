cmake_minimum_required(VERSION 3.15)
project(ContactManagementSystem LANGUAGES CXX)

# Set C++ standard to 20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization and Warnings
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -O3")

# Include Directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/backend
    ${CMAKE_CURRENT_SOURCE_DIR}/backend/algorithms
    ${CMAKE_CURRENT_SOURCE_DIR}/backend/models
    ${CMAKE_CURRENT_SOURCE_DIR}/backend/services
)

# Fetch nlohmann/json and Crow (REST framework) if compiling in an active build environment
# Crow can be downloaded via FetchContent
include(FetchContent)

FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(json)

# Header-only Crow framework declaration
FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG v1.0+5
)
FetchContent_MakeAvailable(crow)

# Main Executable Target
add_executable(ContactManagementSystem
    backend/main.cpp
    backend/models/Contact.hpp
    backend/models/User.hpp
    backend/services/ContactService.hpp
    backend/services/UserService.hpp
    backend/algorithms/LinkedList.hpp
    backend/algorithms/HashTable.hpp
    backend/algorithms/Trie.hpp
    backend/algorithms/AVLTree.hpp
    backend/algorithms/Stack.hpp
    backend/algorithms/Queue.hpp
    backend/algorithms/PriorityQueue.hpp
    backend/algorithms/Graph.hpp
    backend/algorithms/Sorts.hpp
)

# Link JSON and Crow libraries
target_link_libraries(ContactManagementSystem PRIVATE nlohmann_json::nlohmann_json Crow::Crow)

# Threading is required by Crow
find_package(Threads REQUIRED)
target_link_libraries(ContactManagementSystem PRIVATE Threads::Threads)
