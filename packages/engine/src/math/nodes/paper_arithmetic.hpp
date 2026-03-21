#pragma once

#include <string>
#include <vector>

#include "../types.hpp"

namespace math
{
	struct PaperResult
	{
		std::vector<std::vector<int>> digits;
		std::vector<std::vector<int>> carries;
		bool valid = false;
	};

	class PaperArithmetic
	{
		std::string operand_a;
		std::string operand_b;
		PaperOperation operation;
		PaperResult result;

		static bool validate_operand(const std::string& normalized);
		static std::string normalize(std::string s);
		void compute_add();
		void compute_multiply();

	public:
		PaperArithmetic(std::string a, std::string b, PaperOperation op);

		const PaperResult& get_result() const { return result; }

		std::string print_json() const;
		void simplify();
	};
}
