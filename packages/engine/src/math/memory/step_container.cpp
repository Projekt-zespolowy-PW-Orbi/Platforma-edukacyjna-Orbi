#include "step_container.hpp"

void math::step_container::push_back(Step step)
{
	steps.push_back(std::move(step));
}