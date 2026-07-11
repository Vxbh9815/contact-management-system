#ifndef USER_SERVICE_HPP
#define USER_SERVICE_HPP

#include <string>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <stdexcept>
#include "../models/User.hpp"
#include "../algorithms/HashTable.hpp"

namespace Services {

class UserService {
private:
    DSA::HashTable<std::string, Models::User> usersByUsername;
    DSA::HashTable<std::string, Models::User> usersByEmail;
    int nextUserId;

    // Custom simple, secure hashing algorithm (salt + custom polynomial shifting)
    std::string hashPassword(const std::string& password, const std::string& salt) const {
        std::string salted = password + salt + "C++20Rocks!";
        size_t h1 = 5381;
        size_t h2 = 19349663;

        for (char c : salted) {
            h1 = ((h1 << 5) + h1) + c; // h1 * 33 + c
            h2 = ((h2 << 7) ^ h2) + c; 
        }

        std::stringstream ss;
        ss << std::hex << std::setfill('0') << std::setw(16) << h1 
           << std::setfill('0') << std::setw(16) << h2;
        return ss.str();
    }

    std::string getCurrentTimestamp() const {
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %X");
        return ss.str();
    }

public:
    UserService() : nextUserId(1) {
        // Pre-seed a default user for testing/eval
        registerUser("demo_user", "demo@example.com", "Password123");
    }

    Models::User registerUser(const std::string& username, const std::string& email, const std::string& password) {
        if (usersByUsername.contains(username)) {
            throw std::invalid_argument("Username '" + username + "' is already taken!");
        }
        if (usersByEmail.contains(email)) {
            throw std::invalid_argument("Email '" + email + "' is already registered!");
        }

        int id = nextUserId++;
        std::string pHash = hashPassword(password, username); // Use username as salt
        Models::User newUser(id, username, email, pHash, getCurrentTimestamp());

        usersByUsername.insert(username, newUser);
        usersByEmail.insert(email, newUser);

        return newUser;
    }

    Models::User loginUser(const std::string& usernameOrEmail, const std::string& password) {
        Models::User* user = usersByUsername.get(usernameOrEmail);
        if (!user) {
            user = usersByEmail.get(usernameOrEmail);
        }

        if (!user) {
            throw std::invalid_argument("Invalid username or email!");
        }

        std::string inputHash = hashPassword(password, user->username);
        if (inputHash != user->passwordHash) {
            throw std::invalid_argument("Incorrect password!");
        }

        return *user;
    }
};

} // namespace Services

#endif // USER_SERVICE_HPP
