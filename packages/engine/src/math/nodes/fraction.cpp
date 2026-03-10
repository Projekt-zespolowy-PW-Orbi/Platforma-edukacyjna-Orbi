#include "fraction.hpp"

#include <sstream>
#include <numeric>
#include <utility>

#include "../common.hpp"

#include "number.hpp"
#include "product.hpp"

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

	Fraction::Fraction(Function* numerator, Function* denumerator)
		: numerator(numerator), denumerator(denumerator)
	{
	}

	Fraction::~Fraction()
	{
		delete this->numerator;
		delete this->denumerator;
	}

	Step simplify_child(Function*& node)
	{
		SimplifyResult simplified = node->simplify();
		Step step = std::move(simplified.step);

		if(simplified.function != node) {
			delete node;
			node = simplified.function;
		}

		return step;
	}

	void Fraction::multiply_numerator_by(int factor)
	{
		if(factor == 1) return;
		if(factor == 0) {
			delete this->numerator;
			this->numerator = new Number(0);
			return;
		}
		Function* old_numerator = this->numerator;
		this->numerator = new Product(std::vector<Function*>{
			old_numerator,
			new Number(factor)
		});

		delete old_numerator;
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

		GcdResult gcd = gcd_with_steps(a, b);
		int g = gcd.value;
		a /= g;
		b /= g;

		if(a == static_cast<Number*>(this->numerator)->number && b == static_cast<Number*>(this->denumerator)->number) {
			return this;
		}

		if(b == 1) {
			return new Number(a);
		}

		if(b < 0) {
			a = -a;
			b = -b;
		}

		delete this->numerator;
		delete this->denumerator;

		this->numerator = new Number(a);
		this->denumerator = new Number(b);

		return this;
	}

	bool Fraction::scale_to_denominator(int common_denominator)
	{
		if(common_denominator <= 0) return false;
		if(this->denumerator->get_type() != Type::Number) return false;

		int denominator = static_cast<Number*>(this->denumerator)->number;
		if(denominator == 0) return false;

		if(common_denominator % std::abs(denominator) != 0) return false;

		int factor = common_denominator / std::abs(denominator);
		if(denominator < 0) factor = -factor;

		multiply_numerator_by(factor);

		simplify_child(this->numerator);

		delete this->denumerator;
		this->denumerator = new Number(common_denominator);

		return true;
	}

	bool Fraction::make_common_denominator(const std::vector<Fraction*>& fractions)
	{
		if(fractions.size() < 2) return false;

		int common_denominator = 1;
		for(Fraction* fraction : fractions) {
			if(fraction == nullptr) return false;
			if(fraction->denumerator->get_type() != Type::Number) return false;
			
			int denominator = static_cast<Number*>(fraction->denumerator)->number;
			if(denominator == 0) return false;

			LcmResult lcm = lcm_with_steps(common_denominator, std::abs(denominator));
			common_denominator = lcm.value;
		}

		for(Fraction* fraction : fractions) {
			if(!fraction->scale_to_denominator(common_denominator)) {
				return false;
			}
		}
		return true;
	}

	void Fraction::print_json(std::ostream &os, int depth) const
	{
		std::stringstream ss;
		Function::print_json(ss, depth);
		print_tabs(ss, depth);
		ss << "{\n";
		this->numerator->print_json(ss, depth + 1);
		this->denumerator->print_json(ss, depth + 1);
		erase_comma_if_last(ss);
		print_tabs(ss, depth);
		ss << "},\n";
		os << ss.str();
	}

	void Fraction::print_tex(std::ostream &os) const
	{
		os << "\\frac";
		os << "{";
		os << this->numerator;
		os << "}{";
		os << this->denumerator;
		os << "}";
	}

	SimplifyResult Fraction::simplify()
	{
		std::string source = this->to_string();
		Step step(source, source, source);

		Step numerator_step = simplify_child(this->numerator);
		if(numerator_step.HasDetails()) {
			step.AddChild(std::move(numerator_step));
		}

		Step denumerator_step = simplify_child(this->denumerator);
		if(denumerator_step.HasDetails()) {
			step.AddChild(std::move(denumerator_step));
		}

		step.SetMidStep(this->to_string());
		
		Function* reduced = reduce();
		if(reduced != this) {
			this->numerator = nullptr;
			this->denumerator = nullptr;
			delete this;
		}

		Step final_step(source, step.GetMidStep(), reduced->to_string());
		for(const Step& child : step.GetChildren()) {
			final_step.AddChild(child);
		}

		return SimplifyResult(reduced, std::move(final_step));
	}
}
