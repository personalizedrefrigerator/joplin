#include "findSilence.h"
#include "androidUtil.h"

SilenceRange findLongestSilence(
	const std::vector<float>& audioData,
	int sampleRate,
	float minSilenceLength
) {
	int bestCandidateLength = 0;
	int bestCandidateStart = -1;
	int bestCandidateEnd = -1;

	int currentCandidateStart = -1;

	std::vector<float> processedAudio { audioData };

	// Highpass. See https://en.wikipedia.org/wiki/High-pass_filter
	float alpha = 0.95;
	for (int i = 1; i < processedAudio.size(); i++) {
		processedAudio[i] = alpha * processedAudio[i - 1] + alpha * (audioData[i] - audioData[i - 1]);
	}

	int windowSize = 128;
	int windowsPerSecond = sampleRate / windowSize;
	int quietWindows = 0;
	for (int windowOffset = 0; windowOffset < processedAudio.size(); windowOffset += windowSize) {
		float absSum = 0;
		int rollingAverageSize = 10;
		int silentSamples = 0;
		float threshold = 0.1;
		for (int i = windowOffset; i < windowOffset + windowSize && i < processedAudio.size(); i++) {
			absSum += abs(processedAudio[i]);
			if (i - rollingAverageSize >= windowOffset) {
				absSum -= abs(processedAudio[i - rollingAverageSize]);
				if (absSum < threshold) {
					silentSamples++;
				}
			}
		}

		if (silentSamples >= windowSize * 3 / 4) {
			quietWindows ++;
		} else {
			quietWindows = 0;
		}

		int minQuietWindows = windowsPerSecond * minSilenceLength;
		if (quietWindows >= minQuietWindows && currentCandidateStart == -1) {
			// Found a candidate. Start it.
			currentCandidateStart = windowOffset;
		} else if (currentCandidateStart >= 0 && quietWindows == 0) {
			// Ended a candidate. Is it better than the best?
			int currentCandidateLength = windowOffset - currentCandidateStart;
			if (currentCandidateLength > bestCandidateLength) {
				bestCandidateLength = currentCandidateLength;
				bestCandidateStart = currentCandidateStart;
				bestCandidateEnd = windowOffset;
                LOGD("New best candidate with length %d", currentCandidateLength);
			}

			currentCandidateStart = -1;
		}
	}

	// Return the best candidate.
	if (bestCandidateLength == 0) {
		return { .isValid = false, .start = 0, .end = 0 };
	} else {
		return {
            .isValid=true,
            .start=bestCandidateStart,
            .end=bestCandidateEnd
        };
	}
}

