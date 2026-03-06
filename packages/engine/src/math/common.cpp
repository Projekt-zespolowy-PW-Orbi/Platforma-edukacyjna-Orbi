#include "common.hpp"

namespace math
{
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