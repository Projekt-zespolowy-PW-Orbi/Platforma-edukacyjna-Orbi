#pragma once
#include <string>
#include <vector>

#include "../function.hpp"

namespace math
{
	class Fraction : public Function
	{
		Function* numerator;
		Function* denumerator;

	public:
		Fraction(std::string line);
		Fraction(Function* numerator, Function* denumerator);
		~Fraction() override;

		Function* get_numerator() const { return numerator; }
		Function* get_denumerator() const { return denumerator; }
		Function* take_numerator();
		Function* take_denumerator();

		bool scale_to_denominator(int common_denominator);
		static bool make_common_denominator(std::vector<Fraction*>& fractions);

		static Fraction* consume_fractions_for_sum(std::vector<Fraction*>& fractions);
		Function* split_numerator_sum();
		static Fraction* consume_fractions_for_product(std::vector<Fraction*>& fractions, int constant_factor);

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual SimplifyResult simplify() override;
		Type get_type() override { return Type::Fraction; }

	private:
		void multiply_numerator_by(int factor);
		Function* reduce();
		Function* reduce_numbers();	
	};
}
