#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>
#include <map>

namespace facebook::react {

class NativeWhisperModule : public NativeWhisperModuleCxxSpec<NativeWhisperModule> {
public:
    NativeWhisperModule(std::shared_ptr<CallInvoker> jsInvoker);
    std::string test(jsi::Runtime& rt);
    std::string transcribe(jsi::Runtime& rt, std::string filePath, jsi::Object whisperParams);

private:
    // Forward-declare the WhisperContext
    struct WhisperContext;
    std::map<std::string, std::shared_ptr<WhisperContext>> whisperContexts_;
};

} // namespace facebook::react