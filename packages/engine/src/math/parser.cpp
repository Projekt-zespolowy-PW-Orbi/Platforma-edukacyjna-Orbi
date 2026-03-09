#include "parser.hpp"

#include <cctype>
#include <vector>

#include "common.hpp"

namespace math
{
	std::string Parser::unpack_brackets(std::string line)
	{
		auto i = line.begin();
		for(; i != line.end(); i++) {
			if(is_in(white_spaces, *i)) continue;
			if(*i != '(') return line;
			break;
		}

		auto j = line.rbegin();
		for(; j != line.rend(); j++) {
			if(is_in(white_spaces, *j)) continue;
			if(*j != ')') return line;
			break;
		}

		auto i2 = i + 1;
		int open_count = 1;

		while(i2 != j.base() && i2 < line.end()) {
			if(*i2 == '(') open_count++;
			else if(*i2 == ')') open_count--;

			if(open_count == 0) break;
			i2++;
		}

		if(i2 != (j + 1).base()) return line;
		return std::string(i + 1, (j + 1).base());
	}

	std::string Parser::fix_brackets(std::string line)
	{
		if(line.empty()) return line;

		std::string new_line = "";
		for(size_t i = 0; i < line.size(); i++) {
			// Only wrap negative number if at start or after operator/open paren
			bool after_operator = (i == 0) ||
				is_in(std::vector<char>{'+', '-', '*', '/', '^', '('}, new_line.back());

			if(line[i] == '-' && after_operator && i + 1 < line.size() && line[i + 1] != '(') {
				new_line.push_back('(');
				new_line.push_back(line[i]);
				i++;

				while(i < line.size() && std::isdigit((unsigned char)line[i])) {
					new_line.push_back(line[i]);
					i++;
				}
				while(i < line.size() && std::isalpha((unsigned char)line[i])) {
					new_line.push_back(line[i]);
					i++;
				}

				new_line.push_back(')');
				i--;
			}
			else {
				new_line.push_back(line[i]);
			}
		}

		return new_line;
	}
}