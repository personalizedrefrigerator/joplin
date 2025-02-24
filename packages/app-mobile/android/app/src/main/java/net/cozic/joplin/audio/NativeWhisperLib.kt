package net.cozic.joplin.audio

class NativeWhisperLib {
    companion object {
        init {
            System.loadLibrary("joplin")
        }

        // TODO: The example whisper.cpp project transfers pointers as Longs to the Kotlin code.
        // This seems unsafe. Try changing how this is managed.
        external fun init(modelPath: String, languageCode: String, prompt: String): Long;
        external fun free(pointer: Long): Unit;

        external fun fullTranscribe(pointer: Long, audioData: FloatArray): String;
        external fun getPreview(pointer: Long): String;
    }

}