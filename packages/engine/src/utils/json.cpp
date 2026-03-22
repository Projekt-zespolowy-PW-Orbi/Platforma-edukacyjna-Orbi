#include "json.hpp"
#include "math/function.hpp"
#include "math/nodes/paper_arithmetic.hpp"
#include "math/parser.hpp"
#include "utils/ostream.hpp"
#include "math/common.hpp"

#include <iostream>
#include <unordered_map>
#include <functional>
#include <sstream>

static std::string escape_quotes_only(const std::string& s) {
    std::string out;
    out.reserve(s.size());
    for (char c : s) {
        if (c == '"') {
            out += "\\\"";
        } else {
            out += c;
        }
    }
    return out;
}

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

	pos++;
	while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;

	std::string num_str;
	while (pos < json.size() && (json[pos] == '-' || (json[pos] >= '0' && json[pos] <= '9'))) {
		num_str += json[pos];
		pos++;
	}

	return std::stoll(num_str);
}

static void json_paper_op(const std::string& line, const std::string& id, math::PaperOperation op,
	const char* err_msg)
{
	std::string a = extract_string(line, "a");
	std::string b = extract_string(line, "b");
	math::PaperArithmetic paper(std::move(a), std::move(b), op);
	paper.execute();
	if (!paper.get_result().valid) {
		std::cout << "{\"id\":\"" << id << "\",\"ok\":false,\"error\":\"" << err_msg << "\"}" << std::endl;
		return;
	}
	std::string json = paper.print_json();
	std::cout << "{\"id\":\"" << id << "\",\"ok\":true,\"result\":" << json << "}" << std::endl;
}

int json_mode() {
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
				math::SimplifyResult simplified = t->simplify();
				t = simplified.function;
				std::stringstream ss;
				ss << *t;
				math::erase_comma_if_last(ss);
				std::string result = ss.str();
				math::remove_white_spaces(result);
				std::string escaped = escape_quotes_only(result);
				std::cout << "{\"id\":\"" << id << "\",\"ok\":true,\"result\":\"" << escaped << "\"}" << std::endl;
			}
		},
		{
			"paper_add", [&line, &id] {
				json_paper_op(line, id, math::PaperOperation::Add, "invalid paper_add operands");
			}
		},
		{
			"paper_multiply", [&line, &id] {
				json_paper_op(line, id, math::PaperOperation::Multiply, "invalid paper_multiply operands");
			}
		},
	};

	if (auto it = action.find(op); it != action.end())
		it->second();

	return 0;
}

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
		ss << "Basic:" << std::endl << *t << std::endl;
		math::erase_comma_if_last(ss);
		math::SimplifyResult simplified = t->simplify();
		ss << simplified.step.to_json() << std::endl;
		t = simplified.function;
		ss << "Simplified:" << std::endl << *t;
		math::erase_comma_if_last(ss);
		std::cout << ss.str() << std::endl;

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
