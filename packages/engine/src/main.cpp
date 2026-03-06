#include "math/function.hpp"
#include "math/parser.hpp"
#include "utils/ostream.hpp"
#include "utils/json.hpp"

#include <iostream>
#include <string>
#include <vector>

int main(int argc, char *argv[]) {
    // Default to JSON mode (for backward compatibility)
    // Use --parser flag for interactive parser mode
    if (argc > 1 && std::string(argv[1]) == "--parser") {
        return parser_mode();
    } else {
        return json_mode();
    }
}
