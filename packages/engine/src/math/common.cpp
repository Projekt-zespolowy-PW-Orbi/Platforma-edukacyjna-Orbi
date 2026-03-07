#include "common.hpp"

#include <cstdlib>

namespace math
{
	GcdResult gcd_with_steps(int a, int b)
	{
		int x = std::abs(a);
		int y = std::abs(b);
		GcdResult result;
		if(x == 0 && y == 0) {
			result.value = 0;
			return result;
		}
		while(y != 0) {
			int r = x % y;
			result.steps.push_back({x, y, r});
			x = y;
			y = r;
		}
		result.value = x;
		return result;
	}

	void remove_white_spaces(std::string& s)
	{
		s.erase(
			std::remove_if(s.begin(), s.end(),
				[](unsigned char c){ return c==' ' || c=='\t' || c=='\n'; }),
			s.end()
		);
	}

	void print_tabs(std::ostream& os, int how_many)
	{
		while(how_many--) os << '\t';
	}

	void erase_comma_if_last(std::stringstream& ss)
	{
		std::string s = ss.str();

		const auto last = s.find_last_not_of(" \n\r\t");
		if(last != std::string::npos && s[last] == ',') {
			s.erase(last, 1);
		}

		ss.str(std::move(s));
		ss.clear();
		ss.seekp(0, std::ios::end);
	}
}