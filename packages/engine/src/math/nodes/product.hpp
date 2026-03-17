#pragma once
#include <vector>
#include <string>
#include <map>

#include "../function.hpp"
#include "fraction.hpp"

namespace math
{
	class Product : public Function
	{
		std::vector<Function*> products;

		struct ProductAccumulation
		{
			int constant = 1;
			std::map<std::string, int> powers;
			std::vector<Fraction*> fractions;
			std::vector<Function*> other_factors;
		};

	private:
		static Function* build_power_factor(const std::string& name, int power);
		static void append_power_factors(std::vector<Function*>& out, const std::map<std::string, int>& powers);
		void collect_factor(Function* node, ProductAccumulation& acc);
		Function* try_build_simple_result(const ProductAccumulation& acc, const std::vector<Function*>& new_products);
		void merge_fraction_factors(ProductAccumulation& acc, std::vector<Function*>& new_products);
		void append_accumulated_factors(ProductAccumulation& acc, std::vector<Function*>& new_products);
		Function* build_result_from_factors(std::vector<Function*>& new_products);

	public:
		Product(std::string product);
		Product(std::vector<Function*> products) : products(products) {}
		~Product() override;
		
		std::vector<Function*> take_products();

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual SimplifyResult simplify() override;
		Type get_type() override { return Type::Product; }
	};
}
