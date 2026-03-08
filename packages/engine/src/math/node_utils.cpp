#include "node_utils.hpp"

namespace math
{
	void simplify_owned_child(Function*& node)
	{
		Function* simplified = node->simplify();
		node = simplified;
	}
}