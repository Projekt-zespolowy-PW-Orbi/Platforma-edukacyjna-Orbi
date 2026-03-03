cmake_minimum_required(VERSION 3.20)
project(orbi-engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build)

add_executable(orbi-engine
    src/main.cpp
    src/parser/parser.cpp
)
