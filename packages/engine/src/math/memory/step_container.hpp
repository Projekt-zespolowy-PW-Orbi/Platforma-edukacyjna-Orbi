#pragma once

#include <vector>
#include <string>

#include "math/memory/step.hpp"

namespace math {
	class Step_container {
		std::vector<math::Step> steps;
		public:
			void push_back(Step step);
	};
}