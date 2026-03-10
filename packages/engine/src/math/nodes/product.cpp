#include "product.hpp"

#include <map>
#include <sstream>

#include "../common.hpp"

#include "number.hpp"
#include "variable.hpp"
#include "exponential.hpp"

namespace math
{
	Product::Product(std::string line)
	{
		std::vector<Function*> products;
		std::string product = "";
		int opened_count = 0;

		for(auto s : line) {
			if(is_in(white_spaces, s)) continue;

			if(s == '(') {
				opened_count++;
				product += s;
			}
			else if(s == ')') {
				opened_count--;
				product += s;
			}
			else if(opened_count) {
				product += s;
			}
			else if(s == '*') {
				if(!product.empty()) products.push_back(Function::convert(product));
				product = "";
			}
			else {
				product += s;
			}
		}

		if(!product.empty()) products.push_back(Function::convert(product));
		this->products = products;
	}

	void Product::print_json(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print_json(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		for(auto p : this->products) p->print_json(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();
	}

	void Product::print_tex(std::ostream &os) const
	{
		for(int i = 0; i < this->products.size(); i++) {
			if(products[i]->get_type() == Type::Sum) os << "(";
			os << *products[i];
			if(products[i]->get_type() == Type::Sum) os << ")";
			if(i != this->products.size() - 1) os << " * ";
		}
	}

	Function* Product::simplify()
	{
		int constant = 1;
		std::map<std::string, int> powers;
		std::vector<Function*> new_products;

		for(auto p : products) {
			switch(p->get_type()) {
				case Type::Number:
					constant *= static_cast<Number*>(p)->number;
					break;

				case Type::Variable: {
					Variable* var = static_cast<Variable*>(p);
					constant *= var->number;
					powers[var->name]++;
					break;
				}

				default:
					new_products.push_back(p);
					break;
			}
		}

		if(new_products.size() == 0) {
			if(powers.size() == 1) {
				if(powers.begin()->second == 1) {
					return new Variable(powers.begin()->first, constant);
				}
				else {
					return new Exponential(
						new Variable(powers.begin()->first, 1),
						new Number(powers.begin()->second)
					);
				}
			}
			else if(powers.size() == 0) {
				return new Number(constant);
			}
		}

		new_products.push_back(new Number(constant));

		for(auto p : powers) {
			if(p.second == 1)
				new_products.push_back(new Variable(p.first, 1));
			else
				new_products.push_back(new Exponential(
					new Variable(p.first, 1),
					new Number(p.second)
				));
		}

		return new Product(new_products);
	}
}