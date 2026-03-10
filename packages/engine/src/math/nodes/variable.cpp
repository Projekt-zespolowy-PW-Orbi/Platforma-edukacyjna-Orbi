#include "variable.hpp"

#include <iostream>
#include <string>

#include "../common.hpp"

namespace math
{
	Variable::Variable(std::string line)
	{
		std::string number = "";
		std::string var;

		if(line.empty()) {
			this->name = "x";
			this->number = 1;
			return;
		}

		auto begin = line.begin();
		while(begin != line.end() && is_in(numbers, *begin)) {
			number += *begin;
			begin++;
		}

		var = std::string(begin, line.end());
		this->name = var.empty() ? "x" : var;

		if(number == "") this->number = 1;
		else {
			try {
				this->number = std::stoi(number);
			} catch(...) {
				this->number = 1;
			}
		}
	}

	Variable::Variable(std::string name, int number) : number(number), name(name) {}

	void Variable::print_json(std::ostream &os, int depth) const
	{
		while(depth--) os << '\t';

		if(this->number == 1) os << this->name << "," << std::endl;
		else if(this->number == -1) os << "-" << this->name << "," << std::endl;
		else os << this->number << this->name << "," << std::endl;
	}
	void Variable::print_tex(std::ostream &os) const
	{
		if(this->number == 1) os << this->name;
		else if(this->number == -1) os << "-" << this->name;
		else os << this->number << this->name;
	}
}