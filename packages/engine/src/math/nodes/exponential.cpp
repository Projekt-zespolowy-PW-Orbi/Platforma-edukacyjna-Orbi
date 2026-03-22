#include "exponential.hpp"

#include <sstream>

#include "../common.hpp"
#include "../node_utils.hpp"
#include "number.hpp"

namespace math
{
	Exponential::Exponential(std::string line)
	{
		this->base = nullptr;
		this->power = nullptr;

		std::string element = "";
		int opened_count = 0;
		bool first_power = true;

		for(auto s : line) {
			if(is_in(white_spaces, s)) continue;

			if(s == '(') {
				opened_count++;
				element += s;
			}
			else if(s == ')') {
				opened_count--;
				element += s;
			}
			else if(opened_count) {
				element += s;
			}
			else if(s == '^' && first_power) {
				if(!element.empty()) this->base = Function::convert(element);
				else this->base = new Number(0);

				element = "";
				first_power = false;
			}
			else {
				element += s;
			}
		}

		if(!element.empty()) this->power = Function::convert(element);
		else this->power = new Number(1);

		if(this->base == nullptr) this->base = new Number(0);
	}

	Exponential::~Exponential()
	{
		delete this->base;
		delete this->power;
	}

	void Exponential::print_json(std::ostream &os, int depth) const
	{
		std::stringstream ss;	
		Function::print_json(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		this->base->print_json(ss, depth + 1);
		this->power->print_json(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();
	}

	void Exponential::print_tex(std::ostream &os) const
	{
		os << *this->base << "^";
		Type type = this->power->get_type();
		if(type == Type::Variable || type == Type::Number) os << *this->power;
		else os << "{" << *this->power << "}";
	}

	SimplifyResult Exponential::simplify()
	{
		std::string source = this->to_string();
		Step step(source, source, source);
		SimplifyResult sr = simplify_owned_child(this->base);
		if(sr.step.HasDetails()) {
			step.AddChild(std::move(sr.step));
		}
		sr = simplify_owned_child(this->power);
		if(sr.step.HasDetails()) {
			step.AddChild(std::move(sr.step));
		}

		step.SetMidStep(this->to_string());

		if(this->base->get_type() == Type::Number && this->power->get_type() == Type::Number) {
			Number* number = static_cast<Number*>(this->base);
			int j = 1;
			for(int i = 0; i < static_cast<Number*>(this->power)->number; i++) {
				
				j *= number->number;

			}
			step.SetResult(std::to_string(j));
			return SimplifyResult(new Number(j), step);
		}

		return SimplifyResult(this, Step());
	}
}
