#include "paper_arithmetic.hpp"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <utility>

namespace math
{
	namespace
	{
		void trim_leading_zeros_pair(std::vector<int>& digits, std::vector<int>& carries)
		{
			while (digits.size() > 1 && digits.back() == 0) {
				digits.pop_back();
				if (!carries.empty())
					carries.pop_back();
			}
		}

		std::vector<int> string_to_reversed_digits(const std::string& s)
		{
			std::vector<int> v;
			v.reserve(s.size());
			for (int i = static_cast<int>(s.size()) - 1; i >= 0; --i)
				v.push_back(s[static_cast<size_t>(i)] - '0');
			return v;
		}

		struct DigitCarryRow
		{
			std::vector<int> digits;
			std::vector<int> carries;
		};

		DigitCarryRow add_rows(const std::vector<std::vector<int>>& rows)
		{
			DigitCarryRow r;
			if (rows.empty()) {
				r.digits = {0};
				r.carries = {0};
				return r;
			}
			size_t max_len = 0;
			for (const auto& row : rows)
				max_len = std::max(max_len, row.size());
			int carry = 0;
			for (size_t k = 0; k < max_len || carry > 0; ++k) {
				const int carry_in = carry;
				long long t = carry_in;
				for (const auto& row : rows) {
					if (k < row.size())
						t += row[static_cast<size_t>(k)];
				}
				r.digits.push_back(static_cast<int>(t % 10));
				r.carries.push_back(carry_in);
				carry = static_cast<int>(t / 10);
			}
			trim_leading_zeros_pair(r.digits, r.carries);
			return r;
		}

		void pad_reversed_to_same_length(std::vector<int>& a, std::vector<int>& b)
		{
			const size_t n = std::max(a.size(), b.size());
			while (a.size() < n)
				a.push_back(0);
			while (b.size() < n)
				b.push_back(0);
		}

		
		DigitCarryRow subtract_padded(std::vector<int> a, std::vector<int> b)
		{
			DigitCarryRow r;
			pad_reversed_to_same_length(a, b);
			int borrow_in = 0;
			for (size_t k = 0; k < a.size(); ++k) {
				const int ak = a[static_cast<size_t>(k)] - borrow_in;
				const int bk = b[static_cast<size_t>(k)];
				int borrow_out = 0;
				int digit;
				if (ak < bk) {
					digit = ak + 10 - bk;
					borrow_out = 1;
					borrow_in = 1;
				} else {
					digit = ak - bk;
					borrow_in = 0;
				}
				r.digits.push_back(digit);
				r.carries.push_back(borrow_out);
			}
			trim_leading_zeros_pair(r.digits, r.carries);
			return r;
		}

		bool greater_than_or_equal_to(const std::string& a, const std::string& b)
		{
			if (a.size() != b.size())
				return a.size() > b.size();
			return a >= b;
		}

		DigitCarryRow multiply_one_digit_row(const std::vector<int>& row_to_multiply, int digit, int shift_j)
		{
			DigitCarryRow row;
			int carry = 0;
			for (size_t i = 0; i < row_to_multiply.size(); ++i) {
				const int carry_in = carry;
				const int t = row_to_multiply[static_cast<size_t>(i)] * digit + carry_in;
				row.digits.push_back(t % 10);
				row.carries.push_back(carry_in);
				carry = t / 10;
			}
			while (carry > 0) {
				const int carry_in = carry;
				row.digits.push_back(carry % 10);
				row.carries.push_back(carry_in);
				carry = carry / 10;
			}
			for (int s = 0; s < shift_j; ++s) {
				row.digits.insert(row.digits.begin(), 0);
				row.carries.insert(row.carries.begin(), 0);
			}
			trim_leading_zeros_pair(row.digits, row.carries);
			return row;
		}

		std::string to_json(const std::vector<int>& v)
		{
			std::stringstream ss;
			ss << '[';
			for (size_t i = 0; i < v.size(); ++i) {
				if (i > 0)
					ss << ',';
				ss << v[i];
			}
			ss << ']';
			return ss.str();
		}

		std::string to_json(const std::vector<std::vector<int>>& rows)
		{
			std::stringstream ss;
			ss << '[';
			for (size_t r = 0; r < rows.size(); ++r) {
				if (r > 0)
					ss << ',';
				ss << to_json(rows[r]);
			}
			ss << ']';
			return ss.str();
		}
	}

	std::string PaperArithmetic::normalize(std::string s)
	{
		while (!s.empty() && (s.front() == ' ' || s.front() == '\t'))
			s.erase(s.begin());
		while (!s.empty() && (s.back() == ' ' || s.back() == '\t'))
			s.pop_back();

		const auto pos = s.find_first_not_of('0');
		if (pos == std::string::npos || s.empty())
			return "0";
		return s.substr(pos);
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
		const std::vector<int> a_digits = string_to_reversed_digits(operand_a);
		const std::vector<int> b_digits = string_to_reversed_digits(operand_b);
		DigitCarryRow r = add_rows({ a_digits, b_digits });
		result.digits.push_back(std::move(r.digits));
		result.carries.push_back(std::move(r.carries));
		result.valid = true;
	}

	void PaperArithmetic::compute_subtract()
	{
		const std::vector<int> a_digits = string_to_reversed_digits(operand_a);
		const std::vector<int> b_digits = string_to_reversed_digits(operand_b);
		DigitCarryRow r = subtract_padded(a_digits, b_digits);
		result.digits.push_back(std::move(r.digits));
		result.carries.push_back(std::move(r.carries));
		result.valid = true;
	}

	void PaperArithmetic::compute_multiply()
	{
		const std::vector<int> a_digits = string_to_reversed_digits(operand_a);
		std::vector<std::vector<int>> partial_digit_rows;
		partial_digit_rows.reserve(operand_b.size());

		for (int j = 0; j < static_cast<int>(operand_b.size()); ++j) {
			const int d = operand_b[static_cast<size_t>(operand_b.size() - 1 - static_cast<size_t>(j))] - '0';
			DigitCarryRow row = multiply_one_digit_row(a_digits, d, j);
			partial_digit_rows.push_back(row.digits);
			result.digits.push_back(std::move(row.digits));
			result.carries.push_back(std::move(row.carries));
		}

		if (partial_digit_rows.size() > 1) {
			DigitCarryRow sumr = add_rows(partial_digit_rows);
			result.digits.push_back(std::move(sumr.digits));
			result.carries.push_back(std::move(sumr.carries));
		}

		result.valid = true;
	}

	void PaperArithmetic::execute()
	{
		result = PaperResult{};

		std::string a = normalize(operand_a);
		std::string b = normalize(operand_b);

		if (!validate_operand(a) || !validate_operand(b))
			return;

		operand_a = std::move(a);
		operand_b = std::move(b);

		if (operation == PaperOperation::Add) {
			compute_add();
			return;
		}

		if (operation == PaperOperation::Subtract) {
			if (!greater_than_or_equal_to(operand_a, operand_b))
				return;
			compute_subtract();
			return;
		}

		if (operation == PaperOperation::Multiply) {
			compute_multiply();
			return;
		}
	}

	std::string PaperArithmetic::print_json() const
	{
		std::stringstream ss;
		ss << "{\"digits\":" << to_json(result.digits)
		   << ",\"carries\":" << to_json(result.carries) << '}';
		return ss.str();
	}
}
