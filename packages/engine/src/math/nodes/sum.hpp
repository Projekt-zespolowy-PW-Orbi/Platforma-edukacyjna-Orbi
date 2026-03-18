#pragma once
#include <vector>
#include <string>
#include <map>

#include "../function.hpp"
#include "fraction.hpp"

namespace math
{
	class Sum : public Function
	{
		std::vector<Function*> components;

		struct SumAccumulation
		{
			int constant = 0;
			std::vector<Fraction*> fractions;
			std::map<std::string, int> variables_sum;
			std::vector<Function*> other_components;
		};

		void collect_component(Function* node, SumAccumulation& acc, std::vector<Function*>& new_components);
		void merge_constant_into_fractions(SumAccumulation& acc);
		void merge_fraction_components(SumAccumulation& acc, std::vector<Function*>& new_components);

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
