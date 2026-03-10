#include "sum.hpp"

#include <map>
#include <sstream>
#include <functional>

#include "../common.hpp"
#include "../function.hpp"
#include "../memory/step_container.hpp"

#include "number.hpp"
#include "variable.hpp"
#include "product.hpp"
#include "fraction.hpp"

namespace math
{
	Sum::Sum(std::string line)
	{
		std::vector<Function*> components;
		std::string component = "";
		int opened_count = 0;

		for(auto s : line) {
			if(is_in(white_spaces, s)) continue;

			if(s == '(') {
				opened_count++;
				component += s;
			}
			else if(s == ')') {
				opened_count--;
				component += s;
			}
			else if(opened_count) {
				component += s;
			}
			else if(s == '+') {
				if(!component.empty()) components.push_back(Function::convert(component));
				component = "";
			}
			else if(s == '-') {
				if(!component.empty()) components.push_back(Function::convert(component));
				component = "(-1)*";
			}
			else {
				component += s;
			}
		}

		if(!component.empty()) components.push_back(Function::convert(component));
		this->components = components;
	}

	void Sum::print_json(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print_json(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		for(auto f : this->components) f->print_json(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();

	}

	void Sum::print_tex(std::ostream &os) const
	{
		for(int i = 0; i < this->components.size(); i++) {
			os << *components[i];
			if(i != this->components.size() - 1) os << " + ";
		}
	}

	Function* Sum::simplify(Step_container* steps)
	{
		int constant = 0;
		std::vector<Function*> new_components;
		std::vector<Fraction*> fractions;
		std::map<std::string, int> variables_sum;

		std::function<void(Function*)> collect_component = [&](Function* node)
		{
			switch(node->get_type()) {
				case Type::Sum:
					for(Function* c : static_cast<Sum*>(node)->components) {
						collect_component(c);
					}
					break;

				case Type::Number:
					constant += static_cast<Number*>(node)->number;
					break;

				case Type::Fraction:
					fractions.push_back(static_cast<Fraction*>(node));
					break;

				case Type::Variable:
					variables_sum[static_cast<Variable*>(node)->name] += static_cast<Variable*>(node)->number;
					break;

				default:
					new_components.push_back(node);
					break;
			}
		};

		for(Function* component : this->components) {
			std::string source = component->to_string();
			Function* simplified = component->simplify(steps);
			std::string result = simplified->to_string();

			if(steps != nullptr && source != result) {
				steps->push_back(Step(source, result));
			}

			collect_component(simplified);
		}

		if(!fractions.empty() && constant != 0) {
			fractions.push_back(new Fraction(
				new Number(constant),
				new Number(1)
			));
			constant = 0;
		}

		if(fractions.size() > 1) {
			Fraction::make_common_denominator(fractions);
		}

		for(Fraction* fraction : fractions) {
			new_components.push_back(fraction);
		}

		for(const auto& p : variables_sum) {
			if(p.second > 0) {
				new_components.push_back(new Variable(p.first, p.second));
			}
			else if(p.second < 0) {
				new_components.push_back(new Product(std::vector<Function*>{
					new Number(-1),
					new Variable(p.first, -p.second)
				}));
			}
		}

		if(constant > 0 || (constant == 0 && new_components.empty())) {
			new_components.push_back(new Number(constant));
		}
		else if(constant < 0) {
			new_components.push_back(new Product(std::vector<Function*>{
				new Number(-1),
				new Number(-constant)
			}));
		}

		if(new_components.size() == 1) {
			return new_components[0];
		}

		return new Sum(new_components);
	}
}
