#pragma once
#include <string>
#include <ostream>

#include "types.hpp"

namespace math
{
	class Function
	{
	public:
		static Function* convert(std::string line);
		static ComplexFunction complex_function_type(std::string line);

		friend std::ostream& operator<<(std::ostream& os, const Function& s);

		virtual ~Function() = default;
		virtual void print(std::ostream& os, int depth = 0) const;
		virtual Function* simplify() = 0;
		virtual Type get_type() = 0;
	};
}