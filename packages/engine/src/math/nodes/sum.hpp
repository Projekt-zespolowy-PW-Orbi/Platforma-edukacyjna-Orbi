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

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual Function* simplify(Step_container* steps = nullptr) override;
		Type get_type() override { return Type::Sum; }
	};
}
