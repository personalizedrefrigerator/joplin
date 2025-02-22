#include "WhisperSession.h"

#include <utility>
#include <sstream>
#include <algorithm>
#include "whisper.h"
#include "findSilence.h"

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

    return params;
}

std::string
WhisperSession::transcribe_(const std::vector<float>& audio, size_t transcribeCount) {
    whisper_full_params params = buildWhisperParams_();

    // Following the whisper streaming example in setting prompt_tokens to nullptr
    // when using VAD (Voice Activity Detection)
    params.prompt_tokens = nullptr;
    params.prompt_n_tokens = 0;

    transcribeCount = std::min(audio.size(), transcribeCount);

    if (whisper_full(pContext_, params, audio.data(), transcribeCount) != 0) {
//        LOGI("Failed to run Whisper"); TODO: Throw here!
    } else {
        whisper_print_timings(pContext_);
    }

    // Tokens to be used as a prompt for the next run of Whisper
    unsigned int segmentCount = whisper_full_n_segments(pContext_);

    // Build the results
    std::stringstream results;
    for (int i = 0; i < segmentCount; i++) {
        results << "<|" << whisper_full_get_segment_t0(pContext_, i) << "|> ";
        results << whisper_full_get_segment_text(pContext_, i);
        results << " <|" << whisper_full_get_segment_t1(pContext_, i) << "|>";
    }
    return results.str();
}

std::string
WhisperSession::transcribeNextChunk(const float *pAudio, int sizeAudio) {
    std::string finalizedContent;

    // Update the local audio buffer
    for (int i = 0; i < sizeAudio; i++) {
        audioBuffer_.push_back(pAudio[i]);
    }

    // Does the audio buffer need to be split somewhere?
    if (audioBuffer_.size() > WHISPER_SAMPLE_RATE * 25) {
        float minSilenceSeconds = 0.3f;
        auto splitPoint = findLongestSilence(audioBuffer_, WHISPER_SAMPLE_RATE, minSilenceSeconds);
        int halfBufferSize = audioBuffer_.size() / 2;
        auto splitRange = splitPoint.value_or(std::tuple(halfBufferSize, halfBufferSize));

        finalizedContent = transcribe_(audioBuffer_, std::get<0>(splitRange));
        audioBuffer_ = std::vector(audioBuffer_.begin() + std::get<1>(splitRange), audioBuffer_.end());
    }

    previewText_ = transcribe_(audioBuffer_, audioBuffer_.size());
    return finalizedContent;
}

std::string WhisperSession::getPreview() {
    return previewText_;
}
