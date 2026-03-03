#include <iostream>
#include <map>
#include <algorithm>
#include <typeinfo>
#include <cctype>
#include "parser.hpp"

namespace math 
{
	Function* Function::convert(std::string line)
	{
		line = Parser::unpack_brackets(line);
		
		switch(complex_function_type(line)) {
			case ComplexFunction::Exponential:
				return new Exponential(line);
				break;
			case ComplexFunction::Fraction:
				return new Fraction(line);
				break;
			case ComplexFunction::Product:
				return new Product(line);
				break;
			case ComplexFunction::Sum:
				return new Sum(line);
				break;
		}
		
		return make_basic(line);
	}

	ComplexFunction Function::complex_function_type(std::string line)
	{
		ComplexFunction f_type = ComplexFunction::NONE;
		int brackets_deepnes = 0;
		if(*line.begin() == '-') return f_type;
		for(auto s : line) {
			if(is_in(std::vector<char>{'(','['}, s)) brackets_deepnes++;
			else if(is_in(std::vector<char>{')',']'}, s)) brackets_deepnes--;
			if(brackets_deepnes == 0) {
				if(is_in(std::vector<char>{'+','-'}, s)) {
					f_type = static_cast<ComplexFunction>(std::max(static_cast<int>(ComplexFunction::Sum), static_cast<int>(f_type)));
				}
				else if(s == '*') {
					f_type = static_cast<ComplexFunction>(std::max(static_cast<int>(ComplexFunction::Product), static_cast<int>(f_type)));
				}
				else if(s == '/') {
					f_type = static_cast<ComplexFunction>(std::max(static_cast<int>(ComplexFunction::Fraction), static_cast<int>(f_type)));
				} 
				else if(s == '^') {
					f_type = static_cast<ComplexFunction>(std::max(static_cast<int>(ComplexFunction::Exponential), static_cast<int>(f_type)));
				}
			}
		}
		return f_type;
	}

	void Function::print(std::ostream &os, int depth) const
	{
		while(depth--) os << '\t';
		os << typeid(*this).name() << ":\n";
	}

	std::string math::Parser::unpack_brackets(std::string line)
	{
		
		std::string new_string = "";
		auto i = line.begin();
		for(; i != line.end(); i++) {
			if(is_in(white_spaces, *i)) continue;
			if(*i != '(') return line;
			else break;
		}
		auto j = line.rbegin();
		for(; j != line.rend(); j++) {
			if(is_in(white_spaces, *j)) continue;
			if(*j != ')') return line;
			else break;
		}
		
		auto i2 = i + 1;
		int open_count = 1;
		while(i2 != j.base() && i2 < line.end()) {
			
			if(*i2 == '(') open_count++;
			else if(*i2 == ')') open_count--;
			if(open_count == 0) break;
			i2++;
		}
		
		if(i2 != (j + 1).base()) return line;
		return std::string(i + 1, (j + 1).base());		
	}

std::string Parser::fix_brackets(std::string line)
{
	if(line.empty()) return line;
	std::string new_line = "";
	for(size_t i = 0; i < line.size(); i++) {
		// Only wrap negative number if at start or after operator/open paren
		bool after_operator = (i == 0) || 
			is_in(std::vector<char>{'+', '-', '*', '/', '^', '('}, new_line.back());
		
		if(line[i] == '-' && after_operator && i + 1 < line.size() && line[i + 1] != '(') {
			new_line.push_back('(');
			new_line.push_back(line[i]);
			i++;
			while(i < line.size() && std::isdigit(line[i])) {
				new_line.push_back(line[i]);
				i++;
			}
			while(i < line.size() && std::isalpha(line[i])) {
				new_line.push_back(line[i]);
				i++;
			}
			new_line.push_back(')');
			i--;
		}
		else new_line.push_back(line[i]);
	}
	return new_line;
}

math::Sum::Sum(std::string line) 
{ 
	std::vector<Function*> components;
	std::string component = "";
	int opened_count = 0;
	for (auto s : line) {
		if (is_in(white_spaces, s)) continue;
		if(s == '(') {
			opened_count++;
			component += s;
		} else if(s == ')') {
			opened_count--;
			component += s;
		} else if(opened_count) {
			component += s;
		} else if (s == '+') {
			if(!component.empty()) components.push_back(Function::convert(component));
			component = "";
		} else if(s == '-') {
			if(!component.empty()) components.push_back(Function::convert(component));
			component = "(-1)*";
		} else {
			component += s;
		}
	}
	if(!component.empty()) components.push_back(Function::convert(component));
	this->components = components;
}

	void Sum::print(std::ostream &os, int depth) const
	{
		Function::print(os, depth);
		for(auto f : this->components) f->print(os, depth + 1);
	}

Function* Sum::simplify()
{ 
	int components_len = this->components.size();
	int constant = 0;
	std::vector<Function*> new_components;
	std::map<std::string, int> variables_sum;
	
	for(int i = 0; i < components_len; i++) {
		// First simplify the component
		Function* simplified = this->components[i]->simplify();
		
		// Now check the type of simplified result
		switch(simplified->get_type()) {
			case Type::Sum: {
				// Flatten nested sums
				for(auto c : static_cast<Sum*>(simplified)->components) {
					switch(c->get_type()) {
						case Type::Number:
							constant += static_cast<Number*>(c)->number;
							break;
						case Type::Variable:
							variables_sum[static_cast<Variable*>(c)->name] += static_cast<Variable*>(c)->number;
							break;
						default:
							new_components.push_back(c);
							break;
					}
				}
				break;
			}
			case Type::Number:
				constant += static_cast<Number*>(simplified)->number;
				break;
			case Type::Variable:
				variables_sum[static_cast<Variable*>(simplified)->name] += static_cast<Variable*>(simplified)->number;
				break;
			default:
				new_components.push_back(simplified);
				break;
		}
	}
	
	// Add combined variables - negative as Product(-1, var)
	for(auto p : variables_sum) {
		if(p.second > 0) {
			new_components.push_back(new Variable(p.first, p.second));
		} else if(p.second < 0) {
			new_components.push_back(new Product(std::vector<Function*>{
				new Number(-1),
				new Variable(p.first, -p.second)
			}));
		}
	}
	
	// Add constant - negative as Product(-1, num)
	if(constant > 0 || (constant == 0 && new_components.empty())) {
		new_components.push_back(new Number(constant));
	} else if(constant < 0) {
		new_components.push_back(new Product(std::vector<Function*>{
			new Number(-1),
			new Number(-constant)
		}));
	}
	
	// If only one component, return it directly
	if(new_components.size() == 1) {
		return new_components[0];
	}
	
	return new Sum(new_components);
}

Product::Product(std::string line)
{ 
	std::vector<Function*> products;
	std::string product = "";
	int opened_count = 0;
	for (auto s : line) {
		if (is_in(white_spaces, s)) continue;
		if(s == '(') {
			opened_count++;
			product += s;
		} else if(s == ')') {
			opened_count--;
			product += s;
		} else if(opened_count) {
			product += s;
		} else if (s == '*') {
			if(!product.empty()) products.push_back(Function::convert(product));
			product = "";
		} else {
			product += s;
		}
	}
	if(!product.empty()) products.push_back(Function::convert(product));
	this->products = products;
}

	void Product::print(std::ostream &os, int depth) const
	{
		Function::print(os, depth);
		for(auto p : this->products) p->print(os, depth + 1);
	}

	Function* Product::simplify()
	{
		int constant = 1;
		std::map<std::string, int> powers;
		std::vector<Function*> new_products;
		for(auto p : products) {
			switch(p->get_type()) {
				case Type::Number:
					constant *= static_cast<Number*>(p)->number;
					break;
				 case Type::Variable: {
					Variable* var = static_cast<Variable*>(p);
					constant *= var->number;
					powers[var->name]++;
				 	break;
				 }
				 default:
				 	new_products.push_back(p);
					break;
			}
		}
		
		if(new_products.size() == 0) {
			if(powers.size() == 1) {
				if(powers.begin()->second == 1) {
					return new Variable(powers.begin()->first, constant);
				} else return new Exponential(new Variable(powers.begin()->first, 1), new Number(powers.begin()->second));
			} else if(powers.size() == 0) {
				return new Number(constant);
			}
		}
		
		new_products.push_back(new Number(constant));
		for (auto p : powers) {
			if(p.second == 1)
				new_products.push_back(new Variable(p.first, 1));
			else new_products.push_back(new Exponential(new Variable(p.first, 1), new Number(p.second)));
		}

		return new Product(new_products);
	}

	std::ostream &operator<<(std::ostream &os, const Function &s)
	{
		s.print(os);
		return os;
	}

Basic *make_basic(std::string line)
{
	if(line.empty()) return new Number(0);
	auto begin = line.begin();
	while(begin != line.end() && is_in(white_spaces, *begin)) {
		begin++;
	}
	if(begin == line.end()) return new Number(0);
	
	for(auto c = begin; c < line.end(); c++) {
		if(std::isalpha(*c)) return new Variable(std::string(begin, line.end()));
	}
	
	std::string numStr(begin, line.end());
	if(numStr.empty()) return new Number(0);
	return new Number(numStr);
}

Fraction::Fraction(std::string line)
{
	Function* numerator = nullptr;
	Function* denumerator = nullptr;
	std::string element = "";
	int opened_count = 0;
	bool first_slash = true;
	for(auto s : line) {
		if (is_in(white_spaces, s)) continue;
		if(s == '(') {
			opened_count++;
			element += s;
		} else if(s == ')') {
			opened_count--;
			element += s;
		} else if(opened_count) {
			element += s;
		} else if (s == '/' && first_slash) {
			if(!element.empty()) numerator = Function::convert(element);
			else numerator = new Number(0);
			element = "";
			first_slash = false;
		} else {
			element += s;
		}
	}
	if(!element.empty()) denumerator = Function::convert(element);
	else denumerator = new Number(1);
	if(numerator == nullptr) numerator = new Number(0);
	this->numerator = numerator;
	this->denumerator = denumerator;
}

	void Fraction::print(std::ostream &os, int depth) const
	{
		Function::print(os, depth);
		this->numerator->print(os, depth + 1);
		this->denumerator->print(os, depth + 1);
	}

	Function* Fraction::simplify()
	{
		return this;
	}

	Basic::Basic() {}

	void Basic::print(std::ostream &os, int depth) const {}
	
Variable::Variable(std::string line)
{
	std::string number = "";
	std::string var;
	
	if(line.empty()) {
		this->name = "x";
		this->number = 1;
		return;
	}
	
	auto begin = line.begin();
	while(begin != line.end() && is_in(numbers, *begin)) {
		number += *begin;
		begin++;
	}
	var = std::string(begin, line.end());
	this->name = var.empty() ? "x" : var;
	if(number == "") this->number = 1;
	else {
		try {
			this->number = std::stoi(number);
		} catch(...) {
			this->number = 1;
		}
	}
}
	
	Variable::Variable(std::string name, int number) : number(number), name(name) {}
	
void Variable::print(std::ostream &os, int depth) const
{
	while(depth--) os << '\t';
	if(this->number == 1) os << this->name << "," << std::endl;
	else if(this->number == -1) os << "-" << this->name << "," << std::endl;
	else os << this->number << this->name << "," << std::endl;
}
	Function* Variable::simplify()
	{
		return this;
	}
Number::Number(std::string line)
{
	if(line.empty()) {
		this->number = 0;
	} else {
		try {
			this->number = std::stoi(line);
		} catch(...) {
			this->number = 0;
		}
	}
}
	void Number::print(std::ostream &os, int depth) const
	{
		while(depth--) os << '\t';
		os << this->number << "," << std::endl;
	}
Exponential::Exponential(std::string line)
{
	this->base = nullptr;
	this->power = nullptr;
	std::string element = "";
	int opened_count = 0;
	bool first_power = true;
	for(auto s : line) {
		if (is_in(white_spaces, s)) continue;
		if(s == '(') {
			opened_count++;
			element += s;
		} else if(s == ')') {
			opened_count--;
			element += s;
		} else if(opened_count) {
			element += s;
		} else if (s == '^' && first_power) {
			if(!element.empty()) this->base = Function::convert(element);
			else this->base = new Number(0);
			element = "";
			first_power = false;
		} else {
			element += s;
		}
	}
	if(!element.empty()) this->power = Function::convert(element);
	else this->power = new Number(1);
	if(this->base == nullptr) this->base = new Number(0);
}
	void Exponential::print(std::ostream &os, int depth) const
	{
		Function::print(os, depth);
		this->base->print(os, depth + 1);
		this->power->print(os, depth + 1);		
	}
	Function* Exponential::simplify()
	{
		return this;
	}
}