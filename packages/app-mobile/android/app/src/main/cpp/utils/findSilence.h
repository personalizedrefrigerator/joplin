#pragma once

#include <vector>
#include <optional>
#include <tuple>

using AudioRange = std::tuple<int, int>;
using OptionalAudioRange = std::optional<AudioRange>;

OptionalAudioRange findLongestSilence(
	const std::vector<float>& audioData,
	int sampleRate,
	float minSilenceLength
);


