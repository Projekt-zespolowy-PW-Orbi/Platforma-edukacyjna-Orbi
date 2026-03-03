#pragma once
#include <string>

#include "../function.hpp"

namespace math
{
	class Fraction : public Function
	{
		Function* numerator;
		Function* denumerator;

	public:
		Fraction(std::string line);

		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Fraction; }
	};
}