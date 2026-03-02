#include <iostream>
#include <string>

// Minimal JSON helpers — no external dependencies
static std::string extract_string(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";

    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return "";

    pos = json.find('"', pos + 1);
    if (pos == std::string::npos) return "";

    auto end = json.find('"', pos + 1);
    if (end == std::string::npos) return "";

    return json.substr(pos + 1, end - pos - 1);
}

static long long extract_number(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 0;

    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return 0;

    // skip whitespace
    pos++;
    while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;

    std::string num_str;
    while (pos < json.size() && (json[pos] == '-' || (json[pos] >= '0' && json[pos] <= '9'))) {
        num_str += json[pos];
        pos++;
    }

    return std::stoll(num_str);
}

int main() {
    // Read exactly one line from stdin, process it, and exit
    std::string line;
    if (!std::getline(std::cin, line)) {
        return 1;
    }

    if (line.empty()) {
        return 1;
    }

    std::string id = extract_string(line, "id");
    std::string op = extract_string(line, "op");
    long long x = extract_number(line, "x");

    if (op == "double") {
        long long result = x * 2;
        std::cout << "{\"id\":\"" << id << "\",\"ok\":true,\"result\":" << result << "}" << std::endl;
    } else {
        std::cout << "{\"id\":\"" << id << "\",\"ok\":false,\"error\":\"unknown op: " << op << "\"}" << std::endl;
    }

    return 0;
}
