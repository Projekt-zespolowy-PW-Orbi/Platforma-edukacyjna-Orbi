#include "fraction.hpp"

#include <sstream>

#include "../common.hpp"

#include "number.hpp"

namespace math
{
	Fraction::Fraction(std::string line)
	{
		Function* numerator = nullptr;
		Function* denumerator = nullptr;

		std::string element = "";
		int opened_count = 0;
		bool first_slash = true;

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
			else if(s == '/' && first_slash) {
				if(!element.empty()) numerator = Function::convert(element);
				else numerator = new Number(0);

				element = "";
				first_slash = false;
			}
			else {
				element += s;
			}
		}

		if(!element.empty()) denumerator = Function::convert(element);
		else denumerator = new Number(1);

		if(numerator == nullptr) numerator = new Number(0);

		this->numerator = numerator;
		this->denumerator = denumerator;
	}

	void Fraction::print(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		this->numerator->print(ss, depth + 1);
		this->denumerator->print(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();
	}

	Function* Fraction::simplify()
	{
		return this;
	}
}