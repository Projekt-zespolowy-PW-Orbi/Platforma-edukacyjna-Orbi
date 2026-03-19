#include "node_utils.hpp"

namespace math
{
	SimplifyResult simplify_owned_child(Function*& node)
	{
		SimplifyResult simplified = node->simplify();

		if(simplified.function != node) {
			node = simplified.function;
		}

		return simplified;
	}
}