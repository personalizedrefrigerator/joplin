cmake_minimum_required(VERSION 3.13)

# See https://reactnative.dev/docs/the-new-architecture/pure-cxx-modules

# Library name. Is this required to be "appmodules"?
project(appmodules)

set(PROJECT_BASE_DIR ${CMAKE_SOURCE_DIR}/../../../../../)
set(WHISPER_LIB_DIR ${PROJECT_BASE_DIR}/vendor/whisper.cpp)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
# Add source files for each of the custom C++ files here
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ${PROJECT_BASE_DIR}/shared/NativeWhisperModule.cpp)

# Whisper: See https://stackoverflow.com/a/76290722
add_subdirectory(${WHISPER_LIB_DIR} ./whisper)

target_compile_options(${CMAKE_PROJECT_NAME}
        PUBLIC

        -Wno-unused-variable
)

# Directories for header files
target_include_directories(
        ${CMAKE_PROJECT_NAME}
        PUBLIC
        ${PROJECT_BASE_DIR}/shared
        ${WHISPER_LIB_DIR}/include
)

target_link_libraries(${CMAKE_PROJECT_NAME} whisper)