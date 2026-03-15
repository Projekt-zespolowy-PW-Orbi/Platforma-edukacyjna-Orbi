#include "sum.hpp"

#include <map>
#include <sstream>
#include <functional>
#include <utility>

#include "../common.hpp"
#include "../function.hpp"
#include "../node_utils.hpp"

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

	Sum::~Sum()
	{
		for(Function* component : this->components) {
			delete component;
		}
	}

	std::vector<Function*> Sum::take_components()
	{
		std::vector<Function*> taken = this->components;
		this->components.clear();
		return taken;
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

	SimplifyResult Sum::simplify()
	{
		std::string source = this->to_string();
		std::vector<Function*> simplified_components;
		int constant = 0;
		std::vector<Function*> new_components;
		std::vector<Fraction*> fractions;
		std::map<std::string, int> variables_sum;
		Step step(source, source, source);
		std::vector<Function*> owned_components = take_components();

		std::function<void(Function*)> collect_component = [&](Function* node)
		{
			switch(node->get_type()) {
				case Type::Sum: {
					std::vector<Function*> nested_components = static_cast<Sum*>(node)->take_components();
					for(Function* c : nested_components) {
						collect_component(c);
					}
					delete node;
					break;
				}

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

		for(Function* component : owned_components) {
			SimplifyResult simplified = simplify_owned_child(component);
			if(simplified.step.HasDetails()) {
				step.AddChild(std::move(simplified.step));
			}
			simplified_components.push_back(simplified.function);
			collect_component(simplified.function);
		}

		Sum mid_sum(simplified_components);
		step.SetMidStep(mid_sum.to_string());

		if(!fractions.empty() && constant != 0) {
			fractions.push_back(new Fraction(
				new Number(constant),
				new Number(1)
			));
			constant = 0;
		}

		if(fractions.size() > 1 && Fraction::make_common_denominator(fractions)) {
			Function* merged = Fraction::consume_fractions_for_sum(fractions);
			if(merged != nullptr) {
				merged = merged->simplify().function;
				new_components.push_back(merged);
				fractions.clear();
			}
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

		Function* result = nullptr;
		if(new_components.size() == 1) {
			result = new_components[0];
		}
		else {
			result = new Sum(new_components);
		}

		Step final_step(source, step.GetMidStep(), result->to_string());
		for(const Step& child : step.GetChildren()) {
			final_step.AddChild(child);
		}

		return SimplifyResult(result, std::move(final_step));
	}
}
