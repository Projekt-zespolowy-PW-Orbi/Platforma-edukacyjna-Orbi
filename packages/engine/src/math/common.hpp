#pragma once
#include <vector>
#include <algorithm>
#include <sstream>
#include <string>
#include <cctype>
#include <ostream>

namespace math
{
	struct GcdStep
	{
		int dividend;
		int divisor;
		int remainder;
	};
	struct GcdResult
	{
		int value;
		std::vector<GcdStep> steps;
	};
	GcdResult gcd_with_steps(int a, int b);

	struct LcmResult
	{
		int value;
		GcdResult gcd_result;
	};

	LcmResult lcm_with_steps(int a, int b);
	
	template <typename Container, typename T>
	bool is_in(const Container& vec, T value)
	{
		return std::find(vec.begin(), vec.end(), value) != vec.end();
	}

	template <typename Container, typename T>
	bool has(const Container& vec, T value)
	{
		for(auto t : value) {
			if(is_in(vec, t)) return true;
		}
		return false;
	}

	void remove_white_spaces(std::string& s);
	void print_tabs(std::ostream& os, int how_many);
	void erase_comma_if_last(std::stringstream& ss);

	inline const std::vector<char> operators = {'+', '-', '/', '*'};
	inline const std::vector<char> groupers = {'(', ')'};
	inline const std::vector<char> white_spaces = {' ', '\t', '\n'};
	inline const std::vector<char> numbers = {'0','1','2','3','4','5','6','7','8','9'};
}