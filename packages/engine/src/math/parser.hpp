#pragma once
#include <string>

namespace math
{
	class Parser
	{
	public:
		static std::string unpack_brackets(std::string line);
		static std::string fix_brackets(std::string line);
	};
}