#include "step_container.hpp"

#include <sstream>

void math::Step_container::push_back(const Step& step)
{
	steps.push_back(step);
}

void math::Step_container::push_back(Step&& step)
{
	steps.push_back(std::move(step));
}

const std::vector<math::Step>& math::Step_container::get_steps() const
{
	return steps;
}

bool math::Step_container::empty() const
{
	return steps.empty();
}

std::string math::Step_container::to_json() const
{
	std::ostringstream json;
	json << "[";

	for(std::size_t i = 0; i < steps.size(); ++i) {
		if(i != 0) {
			json << ",";
		}

		json << steps[i].to_json();
	}

	json << "]";
	return json.str();
}
