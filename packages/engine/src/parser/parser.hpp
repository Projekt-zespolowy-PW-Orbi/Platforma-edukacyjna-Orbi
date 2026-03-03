#pragma once
#include <string>
#include <vector>
#include <algorithm>

namespace math {
	enum class BasicFunction {
		NONE,
		Sinus,
		Sosinus,
		Tangens,
		ArcusTangens,
		ArcusSinus,
		ArcusCosinus,
		Cotangens,
		ArcusCotangens
	};
	
	enum class ComplexFunction {
		NONE,
		Exponential,
		Fraction,
		Product,
		Sum	
	};
	
	enum class Type {
		Exponential,
		Fraction,
		Product,
		Sum,
		Sinus,
		Sosinus,
		Tangens,
		ArcusTangens,
		ArcusSinus,
		ArcusCosinus,
		Cotangens,
		ArcusCotangens,
		Variable,
		Number
	};
	
	template <typename Container, typename T>
	bool is_in(const Container& vec, T value) {
		return std::find(vec.begin(), vec.end(), value) != vec.end();
	}
	
	template <typename Container, typename T>
	bool has(const Container& vec, T value) {
		for(auto t : value) {
			if(is_in(vec, t)) return true;
		}
		return false;
	}
	
	class Function {
		public:
			static Function* convert(std::string line);
			static ComplexFunction complex_function_type(std::string line);
			
			friend std::ostream& operator<<(std::ostream& os, const Function& s);
			virtual void print(std::ostream& os, int depth = 0) const;
			virtual Function* simplify() = 0;
			virtual Type get_type() = 0;
	};
	
	class Sum : public Function {
		std::vector<Function*> components;
		public:
			Sum(std::string sum);
			Sum(std::vector<Function*> components) : components(components) {}
			virtual void print(std::ostream& os, int depth = 0) const override;
			virtual Function* simplify() override;
			Type get_type() override { return Type::Sum; }
	};
	
	class Product : public Function {
		std::vector<Function*> products;
		public:
			Product(std::string product);
			Product(std::vector<Function*> products) : products(products) {}
			virtual void print(std::ostream& os, int depth = 0) const override;
			virtual Function* simplify() override;
			Type get_type() override { return Type::Product; }
	};
	
	class Fraction : public Function {
		Function* numerator;
		Function* denumerator;
		
		public:
		Fraction(std::string line);
		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Fraction; }
	};
	
	class Exponential : public Function {
		Function* base;
		Function* power;
		
		public:
		Exponential(std::string line);
		Exponential(Function* base, Function *power) : base(base), power(power) {}
		virtual void print(std::ostream& os, int depth = 0) const override;
		virtual Function* simplify() override;
		Type get_type() override { return Type::Exponential; }
	};
	
	class Basic : public Function {
		public:
			Basic();
			virtual void print(std::ostream& os, int depth = 0) const override;
			virtual Function* simplify() = 0;
			virtual Type get_type() = 0;
	};
	
	class Variable : public Basic{
		public:
			int number;
			std::string name;
			Variable(std::string line);	
			Variable(std::string name, int number);
			virtual void print(std::ostream& os, int depth = 0) const override;
			virtual Function* simplify() override;
			virtual Type get_type() override { return Type::Variable; }
	};
	
	class Number : public Basic {
		public:
			int number;
			Number(std::string line);
			Number(int number) : number(number) {}
			virtual void print(std::ostream& os, int depth = 0) const override;
			virtual Function* simplify() { return this; };
			virtual Type get_type() override { return Type::Number; }
	};
	
	class Parser {
		public:
			static std::string unpack_brackets(std::string line);
			static std::string fix_brackets(std::string line);
			
	};
	
	Basic* make_basic(std::string line);
	
	inline const std::vector<char> operators = {'+', '-', '/', '*'};
	inline const std::vector<char> groupers = {'(', ')'};
	inline const std::vector<char> white_spaces = {' ', '	'};
	inline const std::vector<char> numbers = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'};
}