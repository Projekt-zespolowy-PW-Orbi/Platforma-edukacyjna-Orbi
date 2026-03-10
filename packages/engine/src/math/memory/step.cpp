#include "step.hpp"

#include <sstream>

namespace math {
	namespace {
		std::string escape_json_string(const std::string& value)
		{
			std::ostringstream escaped;
			for(char c : value) {
				switch(c) {
					case '\\':
						escaped << "\\\\";
						break;
					case '"':
						escaped << "\\\"";
						break;
					case '\n':
						escaped << "\\n";
						break;
					case '\r':
						escaped << "\\r";
						break;
					case '\t':
						escaped << "\\t";
						break;
					default:
						escaped << c;
						break;
				}
			}

			return escaped.str();
		}
	}

	std::string Step::to_json() const
	{
		std::ostringstream json;
		json << "{\"source\":\"" << source
			 << "\",\"result\":\"" << result
			 << "\",\"children\":[";

		for(std::size_t i = 0; i < children.size(); ++i) {
			if(i != 0) {
				json << ",";
			}

			json << children[i].to_json();
		}

		json << "]}";
		return json.str();
	}
}
