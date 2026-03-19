#pragma once

#include <string>
#include <utility>
#include <vector>

namespace math {
	class Step {
		std::string source;
		std::string mid_step;
		std::string result;
		std::vector<Step> children;

		public:
		Step() = default;
		Step(std::string source, std::string result) : source(std::move(source)), result(std::move(result)) {}
		Step(std::string source, std::string mid_step, std::string result)
			: source(std::move(source)), mid_step(std::move(mid_step)), result(std::move(result)) {}

		inline const std::string& GetSource() const { return source; }
		inline const std::string& GetMidStep() const { return mid_step; }
		inline const std::string& GetResult() const { return result; }
		inline const std::vector<Step>& GetChildren() const { return children; }
		std::string to_json() const;

		inline void SetMidStep(std::string value) { mid_step = std::move(value); }
		inline bool HasMidStep() const { return !mid_step.empty() && mid_step != source; }
		inline void AddChild(const Step& child) { children.push_back(child); }
		inline void AddChild(Step&& child) { children.push_back(std::move(child)); }
		inline bool HasDetails() const { return source != result || HasMidStep() || !children.empty(); }
	};
}
