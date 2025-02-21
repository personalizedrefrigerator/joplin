// Functions defined in whisper.cpp/examples/common, re-exported
// here.

#include <vector>

// Simple voice activity detection
bool vad_simple(std::vector<float> & pcmf32, int sample_rate, int last_ms, float vad_thold, float freq_thold, bool verbose);
