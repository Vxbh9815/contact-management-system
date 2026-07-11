#ifndef USER_HPP
#define USER_HPP

#include <string>

namespace Models {

class User {
public:
    int id;
    std::string username;
    std::string email;
    std::string passwordHash;
    std::string dateCreated;

    User() : id(0) {}

    User(int userId, const std::string& uName, const std::string& uEmail, const std::string& pHash, const std::string& created = "")
        : id(userId), username(uName), email(uEmail), passwordHash(pHash), dateCreated(created) {}

    ~User() = default;
};

} // namespace Models

#endif // USER_HPP
