#include "ostream.hpp"

std::ostream& operator<<(std::ostream& os, const std::vector<std::string>& obj)
{
	os << "vector: (" << std::endl;
	for(const auto& s : obj) {
		os << s << std::endl;
	}
	os << ")" << std::endl;
	return os;
}