#include "fraction.hpp"

#include <sstream>
#include <numeric>

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

	Function* Fraction::reduce()
	{
		Function* reduced = reduce_numbers();
		if(reduced != this) return reduced;

		return this;
	}

	Function* Fraction::reduce_numbers()
	{
		if(this->numerator->get_type() != Type::Number || this->denumerator->get_type() != Type::Number) {
			return this;
		}

		int a = static_cast<Number*>(this->numerator)->number;
		int b = static_cast<Number*>(this->denumerator)->number;

		if(b == 0) return this;
		if(a == 0) return new Number(0);

		int g = std::gcd(std::abs(a), std::abs(b));
		a /= g;
		b /= g;

		if(b < 0) {
			a = -a;
			b = -b;
		}

		if(b == 1) return new Number(a);

		this->numerator = new Number(a);
		this->denumerator = new Number(b);

		return this;
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
		this->numerator = this->numerator->simplify();
		this->denumerator = this->denumerator->simplify();
		return reduce();
	}
}