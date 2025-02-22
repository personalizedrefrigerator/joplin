#pragma once

#include <android/log.h>

#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, "Whisper::JNI", __VA_ARGS__);
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "Whisper::JNI", __VA_ARGS__);
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, "Whisper::JNI", __VA_ARGS__);
