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
#include "utils/androidUtil.h"

void log_android(enum ggml_log_level level, const char* message, void* user_data) {
	android_LogPriority priority = level == 4 ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO;
	__android_log_print(priority, "Whisper::JNI::cpp", "%s", message);
}

jstring stringToJava(JNIEnv *env, const std::string& source) {
	return env->NewStringUTF(source.c_str());
}

std::string stringToCXX(JNIEnv *env, jstring jString) {
	const char *jStringChars = env->GetStringUTFChars(jString, nullptr);
	std::string result { jStringChars };
	env->ReleaseStringUTFChars(jString, jStringChars);

	return result;
}

extern "C"
JNIEXPORT jlong JNICALL
Java_net_cozic_joplin_audio_NativeWhisperLib_00024Companion_init(
		JNIEnv *env,
		jobject thiz,
		jstring modelPath,
		jstring language,
		jstring prompt
) {
	whisper_log_set(log_android, nullptr);

	auto *pSession = new WhisperSession(
		stringToCXX(env, modelPath), stringToCXX(env, language), stringToCXX(env, prompt)
	);

	return (jlong) pSession;
}

extern "C"
JNIEXPORT void JNICALL
Java_net_cozic_joplin_audio_NativeWhisperLib_00024Companion_free(JNIEnv *env, jobject thiz,
																 jlong pointer) {
	std::free(reinterpret_cast<WhisperSession *>(pointer));
}

extern "C"
JNIEXPORT jstring JNICALL
Java_net_cozic_joplin_audio_NativeWhisperLib_00024Companion_fullTranscribe(JNIEnv *env,
																		   jobject thiz,
																		   jlong pointer,
																		   jfloatArray audio_data) {
	auto *pSession = reinterpret_cast<WhisperSession *> (pointer);
	jfloat *pAudioData = env->GetFloatArrayElements(audio_data, nullptr);
	jsize lenAudioData = env->GetArrayLength(audio_data);

	LOGI("Starting Whisper, transcribe %d", lenAudioData);
	auto resultVector = pSession->transcribeNextChunk(pAudioData, lenAudioData);
	auto preview = pSession->getPreview();
	LOGI("Ran Whisper. Got %s (preview %s)", resultVector.c_str(), preview.c_str());

	// JNI_ABORT: "free the buffer without copying back the possible changes", pass 0 to copy
	// changes (there should be no changes)
	env->ReleaseFloatArrayElements(audio_data, pAudioData, JNI_ABORT);

	return stringToJava(env, resultVector);
}
extern "C"
JNIEXPORT jstring JNICALL
Java_net_cozic_joplin_audio_NativeWhisperLib_00024Companion_getPreview(
		JNIEnv *env, jobject thiz, jlong pointer
) {
	auto *pSession = reinterpret_cast<WhisperSession *> (pointer);
	return stringToJava(env, pSession->getPreview());
}