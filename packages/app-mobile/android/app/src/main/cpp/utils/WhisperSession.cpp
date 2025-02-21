#include "WhisperSession.h"

#include <utility>
#include <sstream>
#include "whisper.h"

WhisperSession::WhisperSession(const std::string& modelPath, std::string lang)
    : lang_ {std::move(lang)},
      promptTokens_ { 0 },
      audioHistory_ { 0 } {
    whisper_context_params contextParams = whisper_context_default_params();

    // Lifetime(pModelPath): Whisper.cpp creates a copy of pModelPath and stores it in a std::string.
    // whisper_init_from_file_with_params doesn't seem to otherwise save pModelPath. As such, it's
    // safe to pass a pointer to a std::string's representation:
    const char *pModelPath = modelPath.c_str();
    pContext_ = whisper_init_from_file_with_params(pModelPath, contextParams);

    if (pContext_ == nullptr) {
        throw std::runtime_error("Unable to initialize the Whisper context.");
    }
}

WhisperSession::~WhisperSession() {
    if (pContext_ != nullptr) {
        whisper_free(pContext_);
    }
}

whisper_full_params
WhisperSession::buildWhisperParams_() {
    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.print_realtime = false;
    params.print_timestamps = true;
    params.print_progress = false;
    params.translate = false;
    params.n_threads = 4; // TODO: Calibrate the number of threads to the device.
    params.offset_ms = 0;
    params.no_context = false;
    params.single_segment = true;
    params.suppress_nst = true; // Avoid non-speech tokens (e.g. "(crackle)").
    params.temperature_inc = 0.0f;

    // Lifetime: lifetime(params) < lifetime(lang_) = lifetime(this).
    params.language = lang_.c_str();

    return std::move(params);
}

static int findSilence(const std::vector<float>& audio) {
    // Step 1: Filter the audio
    std::vector<float> data = power(highpass(lowpass(audio)));

    for (int i = 0; i < data.size(); i++) {
        if (data[i] < threshold) {
            belowThresholdCounter++;
        }

        if (belowThresholdCounter > samplesPerSecond / 2) {
            return i;
        }
    }
    return -1;
}

std::vector<std::string>
WhisperSession::transcribeNextChunk(const float *pAudio, int sizeAudio) {
    whisper_full_params params = buildWhisperParams_();

    // Following the whisper streaming example in setting prompt_tokens to nullptr
    // when using VAD (Voice Activity Detection)
    params.prompt_tokens = nullptr;//promptTokens_.data();
    params.prompt_n_tokens = 0;// promptTokens_.size();

    if (whisper_full(pContext_, params, pAudio, sizeAudio) != 0) {
//        LOGI("Failed to run Whisper"); TODO: Throw here!
    } else {
        whisper_print_timings(pContext_);
    }

    // Tokens to be used as a prompt for the next run of Whisper
    promptTokens_.clear();
    unsigned int segmentCount = whisper_full_n_segments(pContext_);
    for (int i = 0; i < segmentCount; i++) {
        int tokenCount = whisper_full_n_tokens(pContext_, i);
        for (int j = 0; j < tokenCount; j++) {
            whisper_token id = whisper_full_get_token_id(pContext_, i, j);
            promptTokens_.push_back(id);
        }
    }

    // Build the results
    std::vector<std::string> results { segmentCount };
    for (int i = 0; i < segmentCount; i++) {
        std::stringstream segmentText;
        segmentText << "<|" << whisper_full_get_segment_t0(pContext_, i) << "|> ";
        segmentText << whisper_full_get_segment_text(pContext_, i);
        segmentText << " <|" << whisper_full_get_segment_t1(pContext_, i) << "|>";

        results.push_back(segmentText.str());
    }
    return results;
}
