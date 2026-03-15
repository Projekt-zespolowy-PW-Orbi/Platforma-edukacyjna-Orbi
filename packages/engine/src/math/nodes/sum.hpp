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
		~Sum() override;
		
		std::vector<Function*> take_components();

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual SimplifyResult simplify() override;
		Type get_type() override { return Type::Sum; }
	};
}
