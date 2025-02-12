#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeWhisperModule : public NativeWhisperModuleCxxSpec<NativeWhisperModule> {
public:
    NativeWhisperModule(std::shared_ptr<CallInvoker> jsInvoker);
    std::string test(jsi::Runtime& rt);
};

} // namespace facebook::react