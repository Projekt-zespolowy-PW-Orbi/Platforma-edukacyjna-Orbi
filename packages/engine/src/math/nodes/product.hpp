#pragma once
#include <vector>
#include <string>

#include "../function.hpp"

namespace math
{
	class Product : public Function
	{
		std::vector<Function*> products;
		
	private:
		static Function* build_power_factor(const std::string& name, int power);
		static void append_power_factors(std::vector<Function*>& out, const std::map<std::string, int>& powers);

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
