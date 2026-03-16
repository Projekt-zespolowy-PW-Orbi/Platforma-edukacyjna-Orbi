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

		std::string step_to_json(const Step& step, int depth)
		{
			std::ostringstream json;
			const std::vector<Step>& children = step.GetChildren();
			append_tabs(json, depth);
			json << "{\n";

			append_tabs(json, depth + 1);
			json << "\"source\": \"" << step.GetSource() << "\",\n";

			if(step.HasMidStep()) {
				append_tabs(json, depth + 1);
				json << "\"midStep\": \"" << step.GetMidStep() << "\",\n";
			}

			append_tabs(json, depth + 1);
			json << "\"result\": \"" << step.GetResult() << "\"";

			if(!children.empty()) {
				json << ",\n";
				append_tabs(json, depth + 1);
				json << "\"children\": [\n";
				for(std::size_t i = 0; i < children.size(); ++i) {
					if(i != 0) {
						json << ",\n";
					}

					json << step_to_json(children[i], depth + 2);
				}
				json << "\n";
				append_tabs(json, depth + 1);
				json << "]";
			}

			json << "\n";
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
