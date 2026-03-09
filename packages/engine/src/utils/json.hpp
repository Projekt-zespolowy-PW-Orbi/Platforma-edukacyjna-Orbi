#include <string>

int parser_mode();
int json_mode();
static long long extract_number(const std::string& json, const std::string& key);
static std::string extract_string(const std::string& json, const std::string& key);