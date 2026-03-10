#pragma once
#include <string>

#include "../function.hpp"

namespace math
{
	class Exponential : public Function
	{
		Function* base;
		Function* power;

	public:
		Exponential(std::string line);
		Exponential(Function* base, Function* power) : base(base), power(power) {}

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Exponential; }
	};
}