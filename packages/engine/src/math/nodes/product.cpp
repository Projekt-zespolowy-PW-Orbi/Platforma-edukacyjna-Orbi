#include "product.hpp"

#include <sstream>
#include <functional>
#include <utility>
#include <iostream>

#include "../common.hpp"
#include "../node_utils.hpp"

#include "number.hpp"
#include "variable.hpp"
#include "exponential.hpp"

#include "config.hpp"

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
				if(is_debug) std::cout << product << std::endl;
				if(!product.empty()) products.push_back(Function::convert(product));
				product = "";
			}
			else {
				product += s;
			}
		}

		if(!product.empty()) {
			if(is_debug) std::cout << product << std::endl;
			products.push_back(Function::convert(product));
		} 
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

	SimplifyResult Product::simplify()
	{
		std::string source = this->to_string();
		std::vector<Function*> simplified_products;
		std::vector<Function*> owned_products = take_products();
		std::vector<Function*> new_products;
		Step step(source, source, source);
		Function* result = nullptr;

		ProductAccumulation acc;

		for(Function*& p : owned_products) {
			SimplifyResult simplified = simplify_owned_child(p);
			if(simplified.step.HasDetails()) {
				step.AddChild(std::move(simplified.step));
			}
			collect_factor(p, acc);
		}

		if (acc.constant == 0) {
			result = new Number(0);
		}

		merge_fraction_factors(acc, new_products);

		if(!result) {
			result = try_build_simple_result(acc, new_products);
		}

		if(!result) {
			Product mid_product(new_products);
			step.SetMidStep(mid_product.to_string());

			append_accumulated_factors(acc, new_products);
			result = build_result_from_factors(new_products);
		}

		return SimplifyResult(result, build_final_step(source, step, result));
	}

	Function* Product::build_power_factor(const std::string& name, int power)
	{
		if(power == 1) {
			return new Variable(name, 1);
		}

		return new Exponential(
			new Variable(name, 1),
			new Number(power)
		);
	}

	void Product::append_power_factors(std::vector<Function*>& out, const std::map<std::string, int>& powers)
	{
		for(const auto& [name, power] : powers) {
			out.push_back(build_power_factor(name, power));
		}
	}

	void Product::collect_factor(Function* node, ProductAccumulation& acc)
	{
		switch(node->get_type()) {
			case Type::Product: {
				std::vector<Function*> nested_products = static_cast<Product*>(node)->take_products();
				for(Function* factor : nested_products) {
					collect_factor(factor, acc);
				}
				delete node;
				break;
			}

			case Type::Number:
				acc.constant *= static_cast<Number*>(node)->number;
				delete node;
				break;

			case Type::Variable: {
				Variable* var = static_cast<Variable*>(node);
				acc.constant *= var->number;
				acc.powers[var->name]++;
				delete node;
				break;
			}

			case Type::Fraction:
				acc.fractions.push_back(static_cast<Fraction*>(node));
				break;

			default:
				acc.other_factors.push_back(node);
				break;
		}
	}

	Function* Product::try_build_simple_result(const ProductAccumulation& acc, const std::vector<Function*>& new_products)
	{
		if(acc.constant == 0) {
			return new Number(0);
		}

		if(!acc.other_factors.empty()) {
			return nullptr;
		}

		if(acc.powers.empty()) {
			return new Number(acc.constant);
		}

		if(acc.powers.size() == 1) {
			const auto& [name, power] = *acc.powers.begin();

			if(power == 1) {
				return new Variable(name, acc.constant);
			}

			if(acc.constant == 1) {
				return build_power_factor(name, power);
			}

			return new Product(std::vector<Function*>{
				new Number(acc.constant),
				build_power_factor(name, power)
			});
		}

		return nullptr;
	}

	void Product::merge_fraction_factors(ProductAccumulation& acc, std::vector<Function*>& new_products)
	{
		if(acc.fractions.empty()) {
			return;
		}

		Function* merged_fraction = Fraction::consume_fractions_for_product(acc.fractions, acc.constant);
		if(merged_fraction == nullptr) {
			return;
		}

		merged_fraction = merged_fraction->simplify().function;
		new_products.push_back(merged_fraction);
		acc.fractions.clear();
		acc.constant = 1;
	}

	void Product::append_accumulated_factors(ProductAccumulation& acc, std::vector<Function*>& new_products)
	{
		if(acc.constant != 1 || new_products.empty()) {
			new_products.push_back(new Number(acc.constant));
		}

		append_power_factors(new_products, acc.powers);
	}

	Function* Product::build_result_from_factors(std::vector<Function*>& new_products)
	{
		if(new_products.size() == 1) {
			return new_products[0];
		}

		return new Product(new_products);
	}

	Step Product::build_final_step(const std::string& source, const Step& step, Function* result)
	{
		Step final_step(source, step.GetMidStep(), result->to_string());

		for(const Step& child : step.GetChildren()) {
			final_step.AddChild(child);
		}

		return final_step;
	}
}
