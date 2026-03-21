#include "paper_arithmetic.hpp"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <utility>

#include "../memory/step.hpp"

namespace math
{
	namespace
	{
		void trim_in_place(std::string& s)
		{
			while (!s.empty() && (s.front() == ' ' || s.front() == '\t'))
				s.erase(s.begin());
			while (!s.empty() && (s.back() == ' ' || s.back() == '\t'))
				s.pop_back();
		}
	}

	std::string PaperArithmetic::normalize(std::string s)
	{
		trim_in_place(s);
		if (s.empty())
			return "0";
		return s;
	}

	bool PaperArithmetic::validate_operand(const std::string& normalized)
	{
		for (unsigned char uc : normalized) {
			if (!std::isdigit(uc))
				return false;
		}
		return true;
	}

	PaperArithmetic::PaperArithmetic(std::string a, std::string b, PaperOperation op)
		: operand_a(std::move(a)), operand_b(std::move(b)), operation(op)
	{
	}

	void PaperArithmetic::compute_add()
	{
		std::string a = operand_a;
		std::string b = operand_b;
		const size_t len = std::max(a.size(), b.size());
		while (a.size() < len)
			a = "0" + a;
		while (b.size() < len)
			b = "0" + b;

		result.digits.clear();
		result.carries.clear();

		int carry = 0;
		for (int i = static_cast<int>(len) - 1; i >= 0; --i) {
			const int da = a[static_cast<size_t>(i)] - '0';
			const int db = b[static_cast<size_t>(i)] - '0';
			const int sum = da + db + carry;
			result.digits.push_back(sum % 10);
			carry = sum / 10;
			result.carries.push_back(carry);
		}

		if (carry > 0) {
			result.digits.push_back(carry);
			result.carries.push_back(0);
		}

		result.valid = true;
	}

	SimplifyResult PaperArithmetic::simplify()
	{
		result = PaperResult{};

		std::string a = normalize(operand_a);
		std::string b = normalize(operand_b);

		if (!validate_operand(a) || !validate_operand(b))
			return SimplifyResult(this, Step());

		if (operation != PaperOperation::Add)
			return SimplifyResult(this, Step());

		operand_a = std::move(a);
		operand_b = std::move(b);
		compute_add();
		return SimplifyResult(this, Step());
	}

	void PaperArithmetic::print_json(std::ostream& os, int depth) const
	{
		(void)depth;
		os << "{\"type\":\"paper_add\",\"a\":\"" << operand_a << "\",\"b\":\"" << operand_b
		   << "\",\"digits\":[";
		for (size_t i = 0; i < result.digits.size(); ++i) {
			if (i > 0)
				os << ',';
			os << result.digits[i];
		}
		os << "],\"carries\":[";
		for (size_t i = 0; i < result.carries.size(); ++i) {
			if (i > 0)
				os << ',';
			os << result.carries[i];
		}
		os << "]}";
	}

	void PaperArithmetic::print_tex(std::ostream& os) const
	{
		os << operand_a << " + " << operand_b << " = ";
		if (!result.valid || result.digits.empty()) {
			os << '?';
			return;
		}
		for (int i = static_cast<int>(result.digits.size()) - 1; i >= 0; --i)
			os << result.digits[static_cast<size_t>(i)];
	}
}
