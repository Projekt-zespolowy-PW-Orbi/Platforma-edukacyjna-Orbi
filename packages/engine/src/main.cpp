#include "math/function.hpp"
#include "math/parser.hpp"
#include "utils/ostream.hpp"
#include "utils/json.hpp"
#include "config.hpp"

#include <iostream>
#include <string>
#include <vector>

bool is_debug = false;

int main(int argc, char *argv[]) {
    // Default to JSON mode (for backward compatibility)
    // Use --parser flag for interactive parser mode
    if((argc == 2 && std::string(argv[1]) == "--json") || (argc == 3 && std::string(argv[2]) == "--json"))
        math::Function::PRINT_METHOD = math::PrintMethod::JSON;
    else if((argc == 2 && std::string(argv[1]) == "--tex") || (argc == 3 && std::string(argv[2]) == "--tex"))
        math::Function::PRINT_METHOD = math::PrintMethod::STRING;
    else math::Function::PRINT_METHOD = math::PrintMethod::STRING;

    if (argc > 1 && std::string(argv[1]) == "--parser") {
        return parser_mode();
    } else {
        return json_mode();
    }
}
