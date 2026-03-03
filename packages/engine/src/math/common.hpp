#pragma once
#include <vector>
#include <algorithm>

namespace math
{
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

	inline const std::vector<char> operators = {'+', '-', '/', '*'};
	inline const std::vector<char> groupers = {'(', ')'};
	inline const std::vector<char> white_spaces = {' ', '	'};
	inline const std::vector<char> numbers = {'0','1','2','3','4','5','6','7','8','9'};
}