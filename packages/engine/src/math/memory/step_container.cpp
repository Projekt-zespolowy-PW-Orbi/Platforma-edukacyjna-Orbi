#include "step_container.hpp"

#include <utility>

void math::Step_container::push_back(const Step& step)
{
	steps.push_back(step);
}

const std::vector<math::Step>& math::Step_container::get_steps() const
{
	return steps;
}

bool math::Step_container::empty() const
{
	return steps.empty();
}
