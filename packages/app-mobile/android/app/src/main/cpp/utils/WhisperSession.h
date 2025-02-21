#pragma once

#include <string>
#include "whisper.h"

class WhisperSession {
public:
    explicit WhisperSession(const std::string& modelPath, std::string lang);
    ~WhisperSession();
    std::vector<std::string> transcribeNextChunk(const float *pAudio, int sizeAudio);

private:
    whisper_params buildWhisperParams_();

    whisper_context *pContext_;
    const std::string lang_;

    std::vector<float> audioHistory_;
    std::vector<int> promptTokens_;
};

