#include "fraction.hpp"

#include <sstream>
#include <numeric>
#include <utility>

#include "../common.hpp"
#include "../node_utils.hpp"

#include "number.hpp"
#include "product.hpp"
#include "sum.hpp"

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

	Function* Fraction::take_numerator()
	{
		Function* taken = this->numerator;
		this->numerator = new Number(0);
		return taken;
	}

	Function* Fraction::take_denumerator()
	{
		Function* taken = this->denumerator;
		this->denumerator = new Number(1);
		return taken;
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

		simplify_owned_child(this->numerator);

		delete this->denumerator;
		this->denumerator = new Number(common_denominator);

		return true;
	}

	bool Fraction::make_common_denominator(std::vector<Fraction*>& fractions)
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

	static Function* make_product_or_single(std::vector<Function*> factors)
	{
		if(factors.empty()) return new Number(1);
		if(factors.size() == 1) return factors[0];
		return new Product(factors);
	}

	Fraction* Fraction::consume_fractions_for_sum(std::vector<Fraction*>& fractions)
	{
		if(fractions.empty()) return nullptr;

		if(fractions[0] == nullptr || fractions[0]->get_denumerator()->get_type() != Type::Number) {
			return nullptr;
		}

		int denominator = static_cast<Number*>(fractions[0]->get_denumerator())->number;
		std::vector<Function*> numerators;

		for(Fraction* fraction : fractions) {
			if(fraction == nullptr || fraction->get_denumerator()->get_type() != Type::Number) {
				return nullptr;
			}

			if(static_cast<Number*>(fraction->get_denumerator())->number != denominator) {
				return nullptr;
			}
		}

		for(Fraction* fraction : fractions) {
			numerators.push_back(fraction->take_numerator());
			delete fraction;
		}

		Function* numerator_sum = nullptr;
		if(numerators.size() == 1) {
			numerator_sum = numerators[0];
		}
		else {
			numerator_sum = new Sum(numerators);
		}

		return new Fraction(numerator_sum, new Number(denominator));
	}

	Function* Fraction::split_numerator_sum()
	{
		if(this->numerator->get_type() != Type::Sum) {
			return this;
		}

		if(this->denumerator->get_type() != Type::Number) {
			return this;
		}

		int denominator = static_cast<Number*>(this->denumerator)->number;
		Sum* numerator_sum = static_cast<Sum*>(take_numerator());
		std::vector<Function*> numerator_components = numerator_sum->take_components();
		std::vector<Function*> parts;

		for(Function* component : numerator_components) {
			parts.push_back(new Fraction(component, new Number(denominator)));
		}

		delete numerator_sum;

		Function* result = nullptr;
		if(parts.empty()) result = new Number(0);
		else if(parts.size() == 1) result = parts[0];
		else result = new Sum(parts);

		delete this;
		return result;
	}

	Fraction* Fraction::consume_fractions_for_product(std::vector<Fraction*>& fractions, int constant_factor)
	{
		if(fractions.empty()) return nullptr;

		std::vector<Function*> numerator_factors;
		std::vector<Function*> denominator_factors;

		if(constant_factor != 1) {
			numerator_factors.push_back(new Number(constant_factor));
		}

		for(Fraction* fraction : fractions) {
			if(fraction == nullptr) return nullptr;

			numerator_factors.push_back(fraction->take_numerator());
			denominator_factors.push_back(fraction->take_denumerator());
			delete fraction;
		}

		Function* numerator = make_product_or_single(numerator_factors);
		Function* denumerator = make_product_or_single(denominator_factors);

		return new Fraction(numerator, denumerator);
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
		os << *this->numerator;
		os << "}{";
		os << *this->denumerator;
		os << "}";
	}

	SimplifyResult Fraction::simplify()
	{
		std::string source = this->to_string();
		Step step(source, source, source);

		SimplifyResult numerator_result = simplify_owned_child(this->numerator);
		if(numerator_result.step.HasDetails()) {
			step.AddChild(std::move(numerator_result.step));
		}

		SimplifyResult denumerator_result = simplify_owned_child(this->denumerator);
		if(denumerator_result.step.HasDetails()) {
			step.AddChild(std::move(denumerator_result.step));
		}

		step.SetMidStep(this->to_string());
		
		//Function* reduced = reduce();

		Step final_step(source, step.GetMidStep(), to_string());
		for(const Step& child : step.GetChildren()) {
			final_step.AddChild(child);
		}

		return SimplifyResult(this, std::move(final_step));
	}
}
