#include "function.hpp"

#include <algorithm>
#include <typeinfo>
#include <vector>
#include <cxxabi.h>

#include "common.hpp"
#include "parser.hpp"

#include "nodes/sum.hpp"
#include "nodes/product.hpp"
#include "nodes/fraction.hpp"
#include "nodes/exponential.hpp"
#include "nodes/basic.hpp"

namespace math
{
	Function* Function::convert(std::string line)
	{
		line = Parser::unpack_brackets(line);

		switch(complex_function_type(line)) {
			case ComplexFunction::Exponential:
				return new Exponential(line);
			case ComplexFunction::Fraction:
				return new Fraction(line);
			case ComplexFunction::Product:
				return new Product(line);
			case ComplexFunction::Sum:
				return new Sum(line);
			case ComplexFunction::NONE:
			default:
				break;
		}

		return make_basic(line);
	}

	ComplexFunction Function::complex_function_type(std::string line)
	{
		ComplexFunction f_type = ComplexFunction::NONE;
		int brackets_deepnes = 0;

		if(line.empty()) return f_type;
		if(*line.begin() == '-') return f_type;

		for(auto s : line) {
			if(is_in(std::vector<char>{'(','['}, s)) brackets_deepnes++;
			else if(is_in(std::vector<char>{')',']'}, s)) brackets_deepnes--;

			if(brackets_deepnes == 0) {
				if(is_in(std::vector<char>{'+','-'}, s)) {
					f_type = static_cast<ComplexFunction>(std::max(
						static_cast<int>(ComplexFunction::Sum),
						static_cast<int>(f_type)
					));
				}
				else if(s == '*') {
					f_type = static_cast<ComplexFunction>(std::max(
						static_cast<int>(ComplexFunction::Product),
						static_cast<int>(f_type)
					));
				}
				else if(s == '/') {
					f_type = static_cast<ComplexFunction>(std::max(
						static_cast<int>(ComplexFunction::Fraction),
						static_cast<int>(f_type)
					));
				}
				else if(s == '^') {
					f_type = static_cast<ComplexFunction>(std::max(
						static_cast<int>(ComplexFunction::Exponential),
						static_cast<int>(f_type)
					));
				}
			}
		}

		return f_type;
	}

	void Function::print(std::ostream &os, int depth) const
	{
		while(depth--) os << '\t';
		os << '"' <<abi::__cxa_demangle(typeid(*this).name(), 0, 0, 0) << '"' << ":\n";
	}

	std::ostream &operator<<(std::ostream &os, const Function &s)
	{
		s.print(os);
		return os;
	}
}