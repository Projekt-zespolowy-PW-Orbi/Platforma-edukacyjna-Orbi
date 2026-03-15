#pragma once

#include "function.hpp"
#include "math/memory/simplify_result.hpp"
#include "math/memory/step.hpp"

namespace math
{
	SimplifyResult simplify_owned_child(Function*& node);
}