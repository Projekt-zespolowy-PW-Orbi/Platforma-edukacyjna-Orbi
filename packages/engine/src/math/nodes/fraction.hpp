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

		bool scale_to_denominator(int common_denominator);
		static bool make_common_denominator(const std::vector<Fraction*>& fractions);

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual Function* simplify(Step_container* steps = nullptr) override;
		Type get_type() override { return Type::Fraction; }

	private:
		void multiply_numerator_by(int factor);
		Function* reduce();
		Function* reduce_numbers();	
	};
}
