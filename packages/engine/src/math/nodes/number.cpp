#include "number.hpp"

#include <iostream>

namespace math
{
	Number::Number(std::string line)
	{
		if(line.empty()) {
			this->number = 0;
		} else {
			try {
				this->number = std::stoi(line);
			} catch(...) {
				this->number = 0;
			}
		}
	}

	void Number::print(std::ostream &os, int depth) const
	{
		while(depth--) os << '\t';
		os << this->number;
	}

	Basic::Basic() {}

	void Basic::print(std::ostream &os, int depth) const
	{
		(void)os;
		(void)depth;
	}
}