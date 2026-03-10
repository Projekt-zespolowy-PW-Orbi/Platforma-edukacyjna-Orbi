#pragma once
#include "basic.hpp"
#include <string>

namespace math
{
	class Variable : public Basic
	{
	public:
		int number;
		std::string name;

		Variable(std::string line);
		Variable(std::string name, int number);

		virtual void print_json(std::ostream& os, int depth = 0) const override;
		virtual void print_tex(std::ostream& os) const override;
		virtual Function* simplify(Step_container* steps = nullptr) override { return this; }
		virtual Type get_type() override { return Type::Variable; }
	};
}
