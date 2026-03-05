#include "sum.hpp"

#include <map>
#include <sstream>

#include "../common.hpp"
#include "../function.hpp"

#include "number.hpp"
#include "variable.hpp"
#include "product.hpp"

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

	void Sum::print(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		for(auto f : this->components) f->print(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();

	}

	Function* Sum::simplify()
	{
		int components_len = (int)this->components.size();
		int constant = 0;
		std::vector<Function*> new_components;
		std::map<std::string, int> variables_sum;

		for(int i = 0; i < components_len; i++) {
			Function* simplified = this->components[i]->simplify();

			switch(simplified->get_type()) {
				case Type::Sum: {
					for(auto c : static_cast<Sum*>(simplified)->components) {
						switch(c->get_type()) {
							case Type::Number:
								constant += static_cast<Number*>(c)->number;
								break;
							case Type::Variable:
								variables_sum[static_cast<Variable*>(c)->name] += static_cast<Variable*>(c)->number;
								break;
							default:
								new_components.push_back(c);
								break;
						}
					}
					break;
				}
				case Type::Number:
					constant += static_cast<Number*>(simplified)->number;
					break;
				case Type::Variable:
					variables_sum[static_cast<Variable*>(simplified)->name] += static_cast<Variable*>(simplified)->number;
					break;
				default:
					new_components.push_back(simplified);
					break;
			}
		}

		for(auto p : variables_sum) {
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