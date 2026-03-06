#pragma once
#include <vector>
#include <string>

#include "../function.hpp"

namespace math
{
	class Sum : public Function
	{
		std::vector<Function*> components;

	public:
		Sum(std::string sum);
		Sum(std::vector<Function*> components) : components(components) {}

		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Sum; }
	};
}