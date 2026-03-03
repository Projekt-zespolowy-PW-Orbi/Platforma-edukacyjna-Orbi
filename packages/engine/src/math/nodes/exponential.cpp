#include "exponential.hpp"

#include "../common.hpp"
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

	void Exponential::print(std::ostream &os, int depth) const
	{
		Function::print(os, depth);
		this->base->print(os, depth + 1);
		this->power->print(os, depth + 1);
	}

	Function* Exponential::simplify()
	{
		return this;
	}
}