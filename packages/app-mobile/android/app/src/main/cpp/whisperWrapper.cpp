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
#include "utils/WhisperSession.h"

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "Whisper::JNI", __VA_ARGS__);

void log_android(enum ggml_log_level level, const char* message, void* user_data) {
    android_LogPriority priority = level == 4 ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO;
    __android_log_print(priority, "Whisper::JNI::cpp", "%s", message);
}

jobjectArray stringArrayToJavaArray(JNIEnv *env, const std::vector<std::string>& vec) {
    jclass StringClass = env->FindClass("java/lang/String");
    jobjectArray result = env->NewObjectArray(vec.size(), StringClass, nullptr);

    for (size_t i = 0; i < vec.size(); i++) {
        const std::string& item = vec[i];
        jobject value = env->NewStringUTF(item.c_str());
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
        jstring modelPath,
        jstring language
) {
    whisper_log_set(log_android, nullptr);
    const char *modelPathChars = env->GetStringUTFChars(modelPath, nullptr);
    const char *languageChars = env->GetStringUTFChars(language, nullptr);

    auto *pSession = new WhisperSession(modelPathChars, languageChars);

    env->ReleaseStringUTFChars(modelPath, modelPathChars);
    env->ReleaseStringUTFChars(language, languageChars);
    return (jlong) pSession;
}

extern "C"
JNIEXPORT void JNICALL
Java_net_cozic_joplin_audio_NativeWhsiperLib_00024Companion_free(JNIEnv *env, jobject thiz,
                                                                 jlong pointer) {
    std::free(reinterpret_cast<WhisperSession *>(pointer));
}

extern "C"
JNIEXPORT jobjectArray JNICALL
Java_net_cozic_joplin_audio_NativeWhsiperLib_00024Companion_fullTranscribe(JNIEnv *env,
                                                                           jobject thiz,
                                                                           jlong pointer,
                                                                           jfloatArray audio_data) {
    auto *pSession = reinterpret_cast<WhisperSession *> (pointer);
    jfloat *pAudioData = env->GetFloatArrayElements(audio_data, nullptr);
    jsize lenAudioData = env->GetArrayLength(audio_data);

    LOGI("Starting Whisper, transcribe %d", lenAudioData);
    auto resultVector = pSession->transcribeNextChunk(pAudioData, lenAudioData);
    LOGI("Ran Whisper");

    // JNI_ABORT: "free the buffer without copying back the possible changes", pass 0 to copy
    // changes (there should be no changes)
    env->ReleaseFloatArrayElements(audio_data, pAudioData, JNI_ABORT);

    return stringArrayToJavaArray(env, resultVector);
}