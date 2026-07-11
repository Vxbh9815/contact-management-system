#ifndef CONTACT_HPP
#define CONTACT_HPP

#include <string>
#include <vector>
#include <sstream>

namespace Models {

class Contact {
public:
    int id;
    std::string name;
    std::vector<std::string> emails;
    std::vector<std::string> phoneNumbers;
    std::string company;
    std::string address;
    std::string birthday; // Format: YYYY-MM-DD
    std::vector<std::string> tags;
    std::vector<std::string> groups;
    std::string notes;
    bool isFavorite;
    std::string dateAdded;
    std::string lastModified;
    int interactionCount; // For priority queue ranking

    Contact() 
        : id(0), isFavorite(false), interactionCount(0) {}

    Contact(int contactId, const std::string& contactName, const std::vector<std::string>& contactEmails,
            const std::vector<std::string>& contactPhones, const std::string& contactCompany = "",
            const std::string& contactAddress = "", const std::string& contactBirthday = "",
            const std::vector<std::string>& contactTags = {}, const std::vector<std::string>& contactGroups = {},
            const std::string& contactNotes = "", bool favorite = false, const std::string& added = "",
            const std::string& modified = "", int interactions = 0)
        : id(contactId), name(contactName), emails(contactEmails), phoneNumbers(contactPhones),
          company(contactCompany), address(contactAddress), birthday(contactBirthday),
          tags(contactTags), groups(contactGroups), notes(contactNotes), isFavorite(favorite),
          dateAdded(added), lastModified(modified), interactionCount(interactions) {}

    ~Contact() = default;

    // Serialization helper to CSV
    std::string toCSV() const {
        std::stringstream ss;
        ss << id << ","
           << escapeCSV(name) << ","
           << escapeCSV(joinVector(emails, ";")) << ","
           << escapeCSV(joinVector(phoneNumbers, ";")) << ","
           << escapeCSV(company) << ","
           << escapeCSV(address) << ","
           << birthday << ","
           << escapeCSV(joinVector(tags, ";")) << ","
           << escapeCSV(joinVector(groups, ";")) << ","
           << escapeCSV(notes) << ","
           << (isFavorite ? "1" : "0") << ","
           << dateAdded << ","
           << lastModified << ","
           << interactionCount;
        return ss.str();
    }

private:
    std::string escapeCSV(const std::string& field) const {
        std::string result = field;
        size_t pos = 0;
        bool needsQuotes = false;
        
        if (result.find(',') != std::string::npos || result.find('"') != std::string::npos || result.find('\n') != std::string::npos) {
            needsQuotes = true;
        }

        // Replace " with ""
        while ((pos = result.find('"', pos)) != std::string::npos) {
            result.replace(pos, 1, "\"\"");
            pos += 2;
        }

        if (needsQuotes) {
            return "\"" + result + "\"";
        }
        return result;
    }

    std::string joinVector(const std::vector<std::string>& vec, const std::string& delim) const {
        std::stringstream ss;
        for (size_t i = 0; i < vec.size(); ++i) {
            ss << vec[i];
            if (i < vec.size() - 1) {
                ss << delim;
            }
        }
        return ss.str();
    }
};

} // namespace Models

#endif // CONTACT_HPP
