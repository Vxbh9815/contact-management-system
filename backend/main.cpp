#include <iostream>
#include <memory>
#include "crow.h"
#include "nlohmann/json.hpp"

#include "models/Contact.hpp"
#include "models/User.hpp"
#include "services/ContactService.hpp"
#include "services/UserService.hpp"

using json = nlohmann::json;

// Global Services
auto contactService = std::make_unique<Services::ContactService>();
auto userService = std::make_unique<Services::UserService>();

// Helper to convert a single contact to JSON
json contactToJSON(const Models::Contact& c) {
    return json{
        {"id", c.id},
        {"name", c.name},
        {"emails", c.emails},
        {"phoneNumbers", c.phoneNumbers},
        {"company", c.company},
        {"address", c.address},
        {"birthday", c.birthday},
        {"tags", c.tags},
        {"groups", c.groups},
        {"notes", c.notes},
        {"isFavorite", c.isFavorite},
        {"dateAdded", c.dateAdded},
        {"lastModified", c.lastModified},
        {"interactionCount", c.interactionCount}
    };
}

int main() {
    crow::SimpleApp app;

    // --- MIDDLEWARE: CORS setup for integration ---
    CROW_ROUTE(app, "/api/health")([]() {
        return crow::response(200, "{\"status\": \"C++ Backend Healthy\"}");
    });

    // --- AUTHENTICATION ROUTES ---
    CROW_ROUTE(app, "/api/auth/register").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        try {
            auto body = json::parse(req.body);
            std::string username = body.at("username").get<std::string>();
            std::string email = body.at("email").get<std::string>();
            std::string password = body.at("password").get<std::string>();

            Models::User user = userService->registerUser(username, email, password);

            json responseJson = {
                {"success", true},
                {"message", "Registration successful!"},
                {"user", {
                    {"id", user.id},
                    {"username", user.username},
                    {"email", user.email},
                    {"dateCreated", user.dateCreated}
                }}
            };
            return crow::response(201, responseJson.dump());
        } catch (const std::exception& e) {
            json err = {{"success", false}, {"error", e.what()}};
            return crow::response(400, err.dump());
        }
    });

    CROW_ROUTE(app, "/api/auth/login").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        try {
            auto body = json::parse(req.body);
            std::string usernameOrEmail = body.at("usernameOrEmail").get<std::string>();
            std::string password = body.at("password").get<std::string>();

            Models::User user = userService->loginUser(usernameOrEmail, password);

            json responseJson = {
                {"success", true},
                {"message", "Login successful!"},
                {"token", "cpp-token-jwt-mocked-payload-success-secret"}, // Simulated session token
                {"user", {
                    {"id", user.id},
                    {"username", user.username},
                    {"email", user.email}
                }}
            };
            return crow::response(200, responseJson.dump());
        } catch (const std::exception& e) {
            json err = {{"success", false}, {"error", e.what()}};
            return crow::response(401, err.dump());
        }
    });

    // --- CONTACT OPERATIONS ---
    
    // GET /api/contacts - Retrieve all active contacts (supports sorting via Merge Sort)
    CROW_ROUTE(app, "/api/contacts").methods(crow::HTTPMethod::GET)([](const crow::request& req) {
        try {
            char* sortByParam = req.url_params.get("sortBy");
            std::vector<Models::Contact> list;
            
            if (sortByParam) {
                std::string sortStr(sortByParam);
                list = contactService->getSortedContacts(sortStr);
            } else {
                // Get ordered contacts using AVL Tree In-Order traversal (alphabetical)
                list = contactService->getAlphabeticalContacts();
            }

            json contactsArr = json::array();
            for (const auto& c : list) {
                contactsArr.push_back(contactToJSON(c));
            }

            return crow::response(200, contactsArr.dump());
        } catch (const std::exception& e) {
            return crow::response(500, json{{"error", e.what()}}.dump());
        }
    });

    // POST /api/contacts - Create contact (checks duplicates with custom Hash Table)
    CROW_ROUTE(app, "/api/contacts").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        try {
            auto body = json::parse(req.body);
            std::string name = body.at("name").get<std::string>();
            std::vector<std::string> emails = body.at("emails").get<std::vector<std::string>>();
            std::vector<std::string> phones = body.at("phoneNumbers").get<std::vector<std::string>>();
            std::string company = body.value("company", "");
            std::string address = body.value("address", "");
            std::string birthday = body.value("birthday", "");
            std::vector<std::string> tags = body.value("tags", std::vector<std::string>());
            std::vector<std::string> groups = body.value("groups", std::vector<std::string>());
            std::string notes = body.value("notes", "");
            bool isFavorite = body.value("isFavorite", false);

            Models::Contact c = contactService->addContact(
                name, emails, phones, company, address, birthday, tags, groups, notes, isFavorite
            );

            return crow::response(201, contactToJSON(c).dump());
        } catch (const std::exception& e) {
            return crow::response(400, json{{"error", e.what()}}.dump());
        }
    });

    // GET /api/contacts/<id> - View individual contact (pushes to LIFO Recently Viewed Stack)
    CROW_ROUTE(app, "/api/contacts/<int>").methods(crow::HTTPMethod::GET)([](int id) {
        try {
            Models::Contact c = contactService->getContactById(id);
            return crow::response(200, contactToJSON(c).dump());
        } catch (const std::exception& e) {
            return crow::response(404, json{{"error", e.what()}}.dump());
        }
    });

    // PUT /api/contacts/<id> - Edit contact details (re-indexes custom DSA trees/hashes)
    CROW_ROUTE(app, "/api/contacts/<int>").methods(crow::HTTPMethod::PUT)([](const crow::request& req, int id) {
        try {
            auto body = json::parse(req.body);
            std::string name = body.at("name").get<std::string>();
            std::vector<std::string> emails = body.at("emails").get<std::vector<std::string>>();
            std::vector<std::string> phones = body.at("phoneNumbers").get<std::vector<std::string>>();
            std::string company = body.value("company", "");
            std::string address = body.value("address", "");
            std::string birthday = body.value("birthday", "");
            std::vector<std::string> tags = body.value("tags", std::vector<std::string>());
            std::vector<std::string> groups = body.value("groups", std::vector<std::string>());
            std::string notes = body.value("notes", "");
            bool isFavorite = body.value("isFavorite", false);

            Models::Contact c = contactService->updateContact(
                id, name, emails, phones, company, address, birthday, tags, groups, notes, isFavorite
            );

            return crow::response(200, contactToJSON(c).dump());
        } catch (const std::exception& e) {
            return crow::response(400, json{{"error", e.what()}}.dump());
        }
    });

    // DELETE /api/contacts/<id> - Delete contact (pushes old data to FIFO Undo Queue)
    CROW_ROUTE(app, "/api/contacts/<int>").methods(crow::HTTPMethod::DELETE)([](int id) {
        bool deleted = contactService->deleteContact(id);
        if (deleted) {
            return crow::response(200, json{{"success", true}, {"message", "Contact deleted"}}.dump());
        } else {
            return crow::response(404, json{{"success", false}, {"error", "Contact not found"}}.dump());
        }
    });

    // POST /api/contacts/undo - Undo last delete (pop from FIFO Queue)
    CROW_ROUTE(app, "/api/contacts/undo").methods(crow::HTTPMethod::POST)([]() {
        try {
            Models::Contact restored = contactService->undoDelete();
            return crow::response(200, json{{"success", true}, {"contact", contactToJSON(restored)}}.dump());
        } catch (const std::exception& e) {
            return crow::response(400, json{{"success", false}, {"error", e.what()}}.dump());
        }
    });

    // POST /api/contacts/favorite/<id> - Toggle favorite
    CROW_ROUTE(app, "/api/contacts/favorite/<int>").methods(crow::HTTPMethod::POST)([](int id) {
        bool success = contactService->toggleFavorite(id);
        if (success) {
            return crow::response(200, json{{"success", true}}.dump());
        }
        return crow::response(404, json{{"success", false}}.dump());
    });

    // GET /api/contacts/search - Prefix search autocomplete (via Trie prefix lookup -> O(L))
    CROW_ROUTE(app, "/api/contacts/search").methods(crow::HTTPMethod::GET)([](const crow::request& req) {
        char* queryParam = req.url_params.get("q");
        if (!queryParam) {
            return crow::response(400, json{{"error", "Missing query parameter 'q'"}}.dump());
        }

        std::string prefix(queryParam);
        std::vector<Models::Contact> matched = contactService->searchByPrefix(prefix);
        
        json matchedArr = json::array();
        for (const auto& c : matched) {
            matchedArr.push_back(contactToJSON(c));
        }

        return crow::response(200, matchedArr.dump());
    });

    // GET /api/contacts/favorites - Get list sorted by interaction count (via Max-Heap Priority Queue)
    CROW_ROUTE(app, "/api/contacts/favorites").methods(crow::HTTPMethod::GET)([]() {
        std::vector<Models::Contact> favorites = contactService->getFavoriteContacts();
        json favoritesArr = json::array();
        for (const auto& c : favorites) {
            favoritesArr.push_back(contactToJSON(c));
        }
        return crow::response(200, favoritesArr.dump());
    });

    // GET /api/contacts/recent - Get LIFO recently viewed contacts (via Stack)
    CROW_ROUTE(app, "/api/contacts/recent").methods(crow::HTTPMethod::GET)([]() {
        std::vector<Models::Contact> recent = contactService->getRecentlyViewed();
        json recentArr = json::array();
        for (const auto& c : recent) {
            recentArr.push_back(contactToJSON(c));
        }
        return crow::response(200, recentArr.dump());
    });

    // GET /api/contacts/related/<id> - Explore degrees of connection (via BFS Graph traversal)
    CROW_ROUTE(app, "/api/contacts/related/<int>").methods(crow::HTTPMethod::GET)([](int id) {
        try {
            std::vector<Models::Contact> related = contactService->getRelatedContacts(id);
            json relatedArr = json::array();
            for (const auto& c : related) {
                relatedArr.push_back(contactToJSON(c));
            }
            return crow::response(200, relatedArr.dump());
        } catch (const std::exception& e) {
            return crow::response(404, json{{"error", e.what()}}.dump());
        }
    });

    // --- BULK OPERATIONS ---
    CROW_ROUTE(app, "/api/contacts/import").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        try {
            int count = contactService->importCSV(req.body);
            return crow::response(200, json{{"success", true}, {"imported", count}}.dump());
        } catch (const std::exception& e) {
            return crow::response(400, json{{"error", e.what()}}.dump());
        }
    });

    CROW_ROUTE(app, "/api/contacts/export").methods(crow::HTTPMethod::GET)([]() {
        std::string csv = contactService->exportCSV();
        crow::response res(200, csv);
        res.set_header("Content-Type", "text/csv");
        res.set_header("Content-Disposition", "attachment; filename=\"contacts.csv\"");
        return res;
    });

    // --- ANALYTICS ---
    CROW_ROUTE(app, "/api/analytics").methods(crow::HTTPMethod::GET)([]() {
        auto analytics = contactService->getAnalytics();
        json metrics = json::object();
        for (const auto& pair : analytics) {
            metrics[pair.first] = pair.second;
        }
        return crow::response(200, metrics.dump());
    });

    std::cout << "C++ REST Backend Server listening on port 8080..." << std::endl;
    app.port(8080).multithreaded().run();
}
