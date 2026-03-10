#include "step.hpp"

#include <sstream>

namespace math {
	namespace {
		void append_tabs(std::ostringstream& out, int depth)
		{
			for(int i = 0; i < depth; ++i) {
				out << '\t';
			}
		}

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

		std::string step_to_json(const Step& step, int depth)
		{
			std::ostringstream json;
			append_tabs(json, depth);
			json << "{\n";

			append_tabs(json, depth + 1);
			json << "\"source\": \"" << escape_json_string(step.GetSource()) << "\",\n";

			append_tabs(json, depth + 1);
			json << "\"result\": \"" << escape_json_string(step.GetResult()) << "\",\n";

			append_tabs(json, depth + 1);
			json << "\"children\": [";

			const std::vector<Step>& children = step.GetChildren();
			if(!children.empty()) {
				json << "\n";
				for(std::size_t i = 0; i < children.size(); ++i) {
					if(i != 0) {
						json << ",\n";
					}

					json << step_to_json(children[i], depth + 2);
				}
				json << "\n";
				append_tabs(json, depth + 1);
			}

			json << "]\n";
			append_tabs(json, depth);
			json << "}";
			return json.str();
		}
	}

	std::string Step::to_json() const
	{
		return step_to_json(*this, 0);
	}
}
