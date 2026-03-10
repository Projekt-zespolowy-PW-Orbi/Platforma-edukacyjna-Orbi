#pragma once
#include <string>
#include <ostream>

#include "types.hpp"

namespace math
{
	enum class PrintMethod {
		JSON,
		STRING
	};
	class Function
	{
	public:
		inline static PrintMethod PRINT_METHOD = PrintMethod::JSON;
		static Function* convert(std::string line);
		static ComplexFunction complex_function_type(std::string line);

		friend std::ostream& operator<<(std::ostream& os, const Function& s);

		virtual ~Function() = default;
		virtual void print_json(std::ostream& os, int depth = 0) const;
		virtual void print_tex(std::ostream& os) const = 0;
		virtual Function* simplify() = 0;
		virtual Type get_type() = 0;
	};
}