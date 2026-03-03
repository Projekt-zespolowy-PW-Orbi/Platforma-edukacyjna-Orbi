#include "basic.hpp"

#include <cctype>
#include <string>

#include "../common.hpp"

#include "number.hpp"
#include "variable.hpp"

namespace math
{
	Basic* make_basic(std::string line)
	{
		if(line.empty()) return new Number(0);

		auto begin = line.begin();
		while(begin != line.end() && is_in(white_spaces, *begin)) {
			begin++;
		}
		if(begin == line.end()) return new Number(0);

		for(auto c = begin; c < line.end(); c++) {
			if(std::isalpha((unsigned char)*c))
				return new Variable(std::string(begin, line.end()));
		}

		std::string numStr(begin, line.end());
		if(numStr.empty()) return new Number(0);

		return new Number(numStr);
	}
}