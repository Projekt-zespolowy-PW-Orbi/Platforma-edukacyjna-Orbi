#include "product.hpp"

#include <map>
#include <sstream>
#include <functional>

#include "../common.hpp"
#include "../node_utils.hpp"

#include "number.hpp"
#include "variable.hpp"
#include "exponential.hpp"
#include "fraction.hpp"


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

	Product::~Product()
	{
		for(Function* product : this->products) {
			delete product;
		}
	}

	std::vector<Function*> Product::take_products()
	{
		std::vector<Function*> taken = this->products;
		this->products.clear();
		return taken;
	}

	void Product::print(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		for(auto p : this->products) p->print(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();
	}

	Function* Product::simplify()
	{
		int constant = 1;
		std::map<std::string, int> powers;
		std::vector<Function*> new_products;
		std::vector<Fraction*> fractions;
		std::vector<Function*> owned_products = take_products();

		std::function<void(Function*)> collect_factor = [&](Function* node)
		{
			switch(node->get_type()) {
				case Type::Product: {
					std::vector<Function*> nested_products = static_cast<Product*>(node)->take_products();
					for(Function* factor : nested_products) {
						collect_factor(factor);
					}
					delete node;
					break;
				}

				case Type::Number:
					constant *= static_cast<Number*>(node)->number;
					break;

				case Type::Variable: {
					Variable* var = static_cast<Variable*>(node);
					constant *= var->number;
					powers[var->name]++;
					break;
				}

				case Type::Fraction: {
					fractions.push_back(static_cast<Fraction*>(node));
					break;
				}

				default:
					new_products.push_back(node);
					break;
			}
		};

		for(Function*& p : owned_products) {
			simplify_owned_child(p);
			collect_factor(p);
		}

		if (constant == 0) {
			delete this;
			return new Number(0);
		}

		if(!fractions.empty()) {
			Function* merged_fraction = Fraction::consume_fractions_for_product(fractions, constant);
			if(merged_fraction != nullptr) {
				merged_fraction = merged_fraction->simplify();
				new_products.push_back(merged_fraction);
				fractions.clear();
				constant = 1;
			}
		}

		if(new_products.empty()) {
			if(powers.size() == 1) {
				if(powers.begin()->second == 1) {
					Function* result = new Variable(powers.begin()->first, constant);
					delete this;
					return result;
				}
				else {
					if(constant == 1) {
						Function* result = new Exponential(
							new Variable(powers.begin()->first, 1),
							new Number(powers.begin()->second)
						);
						delete this;
						return result;
					}
		
					Function* result = new Product(std::vector<Function*>{
						new Number(constant),
						new Exponential(
							new Variable(powers.begin()->first, 1),
							new Number(powers.begin()->second)
						)
					});
					delete this;
					return result;
				}
			}
			else if(powers.empty()) {
				delete this;
				return new Number(constant);
			}
		}

		if(constant != 1 || new_products.empty()) {
			new_products.push_back(new Number(constant));
		}

		for(const auto& p : powers) {
			if(p.second == 1) {
				new_products.push_back(new Variable(p.first, 1));
			}
			else {
				new_products.push_back(new Exponential(
					new Variable(p.first, 1),
					new Number(p.second)
				));
			}
		}
		Function* result = nullptr;
		if(new_products.size() == 1) {
			result = new_products[0];
		}
		else {
			result = new Product(new_products);
		}

		delete this;
		return result;
	}
}