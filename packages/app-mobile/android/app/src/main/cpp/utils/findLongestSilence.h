#pragma once

#include <vector>
#include <optional>
#include <tuple>

struct SilenceRange {
    bool isValid;
    int start;
    int end;
};

SilenceRange findLongestSilence(
	const std::vector<float>& audioData,
	int sampleRate,
	float minSilenceLength
);


