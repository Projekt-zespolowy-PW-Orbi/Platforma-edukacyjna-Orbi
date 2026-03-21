#pragma once

#include <string>
#include <vector>

#include "../function.hpp"
#include "../types.hpp"

namespace math
{
	struct PaperResult
	{
		std::vector<int> digits;
		std::vector<int> carries;
		bool valid = false;
	};

	class PaperArithmetic : public Function
	{
		std::string operand_a;
		std::string operand_b;
		PaperOperation operation;
		PaperResult result;

		static bool validate_operand(const std::string& normalized);
		static std::string normalize(std::string s);
		void compute_add();

	public:
		PaperArithmetic(std::string a, std::string b, PaperOperation op);

		const PaperResult& get_result() const { return result; }

		void print_json(std::ostream& os, int depth = 0) const override;
		void print_tex(std::ostream& os) const override;
		SimplifyResult simplify() override;
		Type get_type() override { return Type::PaperArithmetic; }
	};
}
