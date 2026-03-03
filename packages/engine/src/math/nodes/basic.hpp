#pragma once
#include "../function.hpp"

namespace math
{
	class Basic : public Function
	{
	public:
		Basic();
		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() = 0;
		virtual Type get_type() = 0;
	};

	Basic* make_basic(std::string line);
}