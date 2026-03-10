#pragma once

#include <utility>

#include "step.hpp"

namespace math {
	class Function;

	struct SimplifyResult {
		Function* function;
		Step step;

		SimplifyResult(Function* function, Step step) : function(function), step(std::move(step)) {}
	};
}
