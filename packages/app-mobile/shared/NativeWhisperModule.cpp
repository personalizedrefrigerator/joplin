#include "NativeWhisperModule.h"
#include "whisper.h"

namespace facebook::react {

NativeWhisperModule::NativeWhisperModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeWhisperModuleCxxSpec(std::move(jsInvoker)) {}

std::string NativeWhisperModule::test(jsi::Runtime& rt) {
    whisper_context_params cparams = whisper_context_default_params();
    return std::string{"Test."};
}

std::string NativeWhisperModule::transcribe(jsi::Runtime &rt, std::string filePath, jsi::Object whisperParams) {

}

} // namespace facebook::react