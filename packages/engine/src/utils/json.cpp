#include "json.hpp"
#include "math/function.hpp"
#include "math/parser.hpp"
#include "utils/ostream.hpp"
#include "utils/json.hpp"
#include "math/common.hpp"

#include <iostream>
#include <vector>
#include <unordered_map>
#include <functional>
#include <sstream>

static std::string extract_string(const std::string& json, const std::string& key) {
	std::string search = "\"" + key + "\"";
	auto pos = json.find(search);
	if (pos == std::string::npos) return "";

	pos = json.find(':', pos + search.size());
	if (pos == std::string::npos) return "";

	pos = json.find('"', pos + 1);
	if (pos == std::string::npos) return "";

	auto end = json.find('"', pos + 1);
	if (end == std::string::npos) return "";

	return json.substr(pos + 1, end - pos - 1);
}

static long long extract_number(const std::string& json, const std::string& key) {
	std::string search = "\"" + key + "\"";
	auto pos = json.find(search);
	if (pos == std::string::npos) return 0;

	pos = json.find(':', pos + search.size());
	if (pos == std::string::npos) return 0;

	// skip whitespace
	pos++;
	while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;

	std::string num_str;
	while (pos < json.size() && (json[pos] == '-' || (json[pos] >= '0' && json[pos] <= '9'))) {
		num_str += json[pos];
		pos++;
	}

	return std::stoll(num_str);
}

// JSON mode: process one JSON command and exit
int json_mode() {
	// Read exactly one line from stdin, process it, and exit
	std::string line;
	if (!std::getline(std::cin, line)) {
		return 1;
	}

	if (line.empty()) {
		return 1;
	}

	std::string id = extract_string(line, "id");
	std::string op = extract_string(line, "op");
	std::string x = extract_string(line, "x");

	std::unordered_map<std::string, std::function<void()>> action = {
		{
			"simplify", [&x, &id]
			{
				x = math::Parser::fix_brackets(x);
				math::Function* t = math::Function::convert(x);
				t = t->simplify();
				std::cout << "{\"id\":\"" << id << "\",\"ok\":true,\"result\":\"" << *t << "\"}" << std::endl;
			}
		},
	};

	if (auto it = action.find(op); it != action.end())
		it->second();

	return 0;
}

// Parser mode: interactive math expression parser
int parser_mode() {
	std::string input;
	std::stringstream ss;
	
	while (true)
	{
		ss.str("");
		ss.clear();
		std::cout << "Enter text: ";
		std::getline(std::cin, input);
		
		// Remove BOM if present (UTF-8 BOM: EF BB BF)
		if(input.size() >= 3 && 
		(unsigned char)input[0] == 0xEF && 
		(unsigned char)input[1] == 0xBB && 
		(unsigned char)input[2] == 0xBF) {
			input = input.substr(3);
		}
		
		// Remove any leading whitespace/invisible chars
		while(!input.empty() && (input[0] == ' ' || input[0] == '\t' || (unsigned char)input[0] > 127)) {
			input = input.substr(1);
		}
		
		std::cout << "You entered: " << input << std::endl;

		if(input.empty()) {
			std::cout << "Empty input" << std::endl;
			return 0;
		}

		input = math::Parser::fix_brackets(input);
		math::Function* t = math::Function::convert(input);
		ss << "Basic:" << std::endl << *t;
		math::erase_comma_if_last(ss);
		t = t->simplify();
		ss << "Simplified:" << std::endl << *t;
		math::erase_comma_if_last(ss);
		std::cout << ss.str();

		std::cout << "-----------------------------" << std::endl;
		std::cout << "Do you want to continue? (y/n): ";
		std::string cont;
		std::getline(std::cin, cont);
		if(cont != "y" && cont != "Y") {
			break;
		}
	}
	
	return 0;
}