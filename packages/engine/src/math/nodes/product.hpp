#pragma once
#include <vector>
#include <string>

#include "../function.hpp"

namespace math
{
	class Product : public Function
	{
		std::vector<Function*> products;

	public:
		Product(std::string product);
		Product(std::vector<Function*> products) : products(products) {}

		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Product; }
	};
}