// Write C++ code here.
//
// Do not forget to dynamically load the C++ library into your application.
//
// For instance,
//
// In MainActivity.java:
//    static {
//       System.loadLibrary("joplin");
//    }
//
// Or, in MainActivity.kt:
//    companion object {
//      init {
//         System.loadLibrary("joplin")
//      }
//    }
#include <jni.h>
#include <memory>
#include <string>
#include <sstream>
#include <android/log.h>
#include "whisper.h"

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "Whisper::JNI", __VA_ARGS__);

void log_android(enum ggml_log_level level, const char* message, void* user_data) {
    android_LogPriority priority = level == 4 ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO;
    __android_log_print(priority, "Whisper::JNI::cpp", "%s", message);
}

jobjectArray buildWhisperResults(JNIEnv *env, whisper_context *pContext) {
    int segmentCount = whisper_full_n_segments(pContext);
    LOGI("Start result array");

    jclass StringClass = env->FindClass("java/lang/String");
    jobjectArray result = env->NewObjectArray(segmentCount, StringClass, nullptr);
    for (int i = 0; i < segmentCount; i++) {
        std::stringstream segmentText;
        segmentText << " <|" << whisper_full_get_segment_t0(pContext, i) << "|> ";
        segmentText << whisper_full_get_segment_text(pContext, i);
        segmentText << " <|" << whisper_full_get_segment_t1(pContext, i) << "|> ";

        std::string segmentTextStr = segmentText.str();
        jobject value = env->NewStringUTF(segmentTextStr.c_str());
        env->SetObjectArrayElement(result, i, value);
        LOGI("Add result item");
    }
    LOGI("End result array");
    return result;
}

extern "C"
JNIEXPORT jlong JNICALL
Java_net_cozic_joplin_audio_NativeWhsiperLib_00024Companion_init(
        JNIEnv *env,
        jobject thiz,
        jstring modelPath
) {
    whisper_log_set(log_android, nullptr);
    const char *modelPathChars = env->GetStringUTFChars(modelPath, nullptr);
    whisper_context_params contextParams = whisper_context_default_params();
    whisper_context *ctx =
        whisper_init_from_file_with_params(modelPathChars, contextParams);
    if (ctx == nullptr) {
        LOGI("ERROR loading Whisper");
    }

    env->ReleaseStringUTFChars(modelPath, modelPathChars);
    return (jlong) ctx;
}

extern "C"
JNIEXPORT void JNICALL
Java_net_cozic_joplin_audio_NativeWhsiperLib_00024Companion_free(JNIEnv *env, jobject thiz,
                                                                 jlong pointer) {
    whisper_free(reinterpret_cast<whisper_context*> (pointer));
}

extern "C"
JNIEXPORT jobjectArray JNICALL
Java_net_cozic_joplin_audio_NativeWhsiperLib_00024Companion_fullTranscribe(JNIEnv *env,
                                                                           jobject thiz,
                                                                           jlong pointer,
                                                                           jstring language_code_str,
                                                                           jint num_threads,
                                                                           jfloatArray audio_data) {
    whisper_context *pContext = reinterpret_cast<whisper_context *> (pointer);
    jfloat *pAudioData = env->GetFloatArrayElements(audio_data, nullptr);
    jsize lenAudioData = env->GetArrayLength(audio_data);
    const char *languageCode = env->GetStringUTFChars(language_code_str, nullptr);

    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.print_realtime = false;
    params.print_timestamps = true;
    params.print_progress = false;
    params.translate = false;
    params.language = languageCode;
    params.n_threads = num_threads;
    params.offset_ms = 0;
    params.no_context = true;
    params.single_segment = false;

    // May not be necessary (seems to be for benchmarking)
    whisper_reset_timings(pContext);

    LOGI("Starting Whisper, transcribe %d", lenAudioData);

    if (whisper_full(pContext, params, pAudioData, lenAudioData) != 0) {
        LOGI("Failed to run Whisper");
    } else {
        whisper_print_timings(pContext);
    }
    LOGI("Ran Whisper");

    jobjectArray result = buildWhisperResults(env, pContext);

    // JNI_ABORT: "free the buffer without copying back the possible changes", pass 0 to copy
    // changes (there should be no changes)
    env->ReleaseFloatArrayElements(audio_data, pAudioData, JNI_ABORT);
    env->ReleaseStringUTFChars(language_code_str, languageCode);

    return result;
}