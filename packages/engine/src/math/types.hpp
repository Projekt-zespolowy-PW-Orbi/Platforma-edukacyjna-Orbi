#pragma once

namespace math
{
	enum class BasicFunction
	{
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

	enum class ComplexFunction
	{
		NONE,
		Exponential,
		Fraction,
		Product,
		Sum
	};

	enum class Type
	{
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
}