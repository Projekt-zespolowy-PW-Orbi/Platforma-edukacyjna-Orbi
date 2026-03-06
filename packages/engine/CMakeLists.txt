cmake_minimum_required(VERSION 3.20)
project(orbi-engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build)

file(GLOB_RECURSE MATH_SOURCES CONFIGURE_DEPENDS
	"${CMAKE_CURRENT_SOURCE_DIR}/src/math/*.cpp"
    "${CMAKE_CURRENT_SOURCE_DIR}/src/math/**/*.cpp"
)

file(GLOB_RECURSE UTIL_SOURCES CONFIGURE_DEPENDS
	"${CMAKE_CURRENT_SOURCE_DIR}/src/utils/*.cpp"
	"${CMAKE_CURRENT_SOURCE_DIR}/src/utils/**/*.cpp"
)

add_library(math STATIC ${MATH_SOURCES})
target_include_directories(math PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)

add_executable(orbi-engine src/main.cpp ${UTIL_SOURCES})
target_link_libraries(orbi-engine PRIVATE math)
