#pragma once

#include <string>

namespace math {
	class Step {
		std::string Source;
		std::string Result;

		public:
		Step(std::string Source, std::string Result) : Source(Source), Result(Result) {}
		inline std::string GetSource() {return Source;}
		inline std::string Result GetResult() {return Result;}
	}
}