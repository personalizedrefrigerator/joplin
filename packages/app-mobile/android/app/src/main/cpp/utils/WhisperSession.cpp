#include "WhisperSession.h"

#include <utility>
#include <sstream>
#include "whisper.h"

WhisperSession::WhisperSession(const std::string& modelPath, std::string lang)
    : lang_ {std::move(lang)} {
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

std::vector<std::string>
WhisperSession::transcribeNextChunk(const float *pAudio, int sizeAudio) {
    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.print_realtime = false;
    params.print_timestamps = true;
    params.print_progress = false;
    params.translate = false;
    params.n_threads = 4;
    params.offset_ms = 0;
    params.no_context = true;
    params.single_segment = true;
    params.suppress_nst = true; // Avoid non-speech tokens (e.g. "(crackle)").
//    params.initial_prompt = prompt;

    // Lifetime: lifetime(params) < lifetime(lang_) = lifetime(this).
    params.language = lang_.c_str();

    // May not be necessary (seems to be for benchmarking)
    whisper_reset_timings(pContext_);

//    LOGI("Starting Whisper, transcribe %d", lenAudioData);

    if (whisper_full(pContext_, params, pAudio, sizeAudio) != 0) {
//        LOGI("Failed to run Whisper");
    } else {
        whisper_print_timings(pContext_);
    }

    unsigned int segmentCount = whisper_full_n_segments(pContext_);
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
