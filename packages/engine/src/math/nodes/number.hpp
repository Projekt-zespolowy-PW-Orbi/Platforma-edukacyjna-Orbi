#pragma once
#include "basic.hpp"
#include <string>

namespace math
{
	class Number : public Basic
	{
	public:
		int number;

		Number(std::string line);
		Number(int number) : number(number) {}

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual Function* simplify(Step_container* steps = nullptr) override { return this; }
		virtual Type get_type() override { return Type::Number; }
	};
}
