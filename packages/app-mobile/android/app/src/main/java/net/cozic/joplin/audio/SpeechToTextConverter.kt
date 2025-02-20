package net.cozic.joplin.audio

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import java.io.Closeable
import java.nio.FloatBuffer
import java.nio.IntBuffer
import kotlin.time.DurationUnit
import kotlin.time.measureTimedValue

class SpeechToTextConverter(
	modelPath: String,
	locale: String,
	recorderFactory: AudioRecorderFactory,
	context: Context,
) : Closeable {
	private val recorder = recorderFactory(context)
	private val whisper = NativeWhsiperLib.init(modelPath)
	private val languageCode = Regex("_.*").replace(locale, "")

	fun start() {
		recorder.start()
	}

	private fun convert(data: FloatArray, prompt: String): String {
		Log.i("Whisper", "PRE TRANSCRIBE ${data.size}")
		val result = NativeWhsiperLib.fullTranscribe(whisper, languageCode, 6, data, prompt).joinToString(separator="")
		Log.i("Whisper", "RES: ${result}")
		return result;
	}

	fun dropFirstSeconds(seconds: Double) {
		Log.i("Whisper", "Drop first seconds $seconds")
		recorder.dropFirstSeconds(seconds)
	}

	val bufferLengthSeconds: Double get() = recorder.bufferLengthSeconds

	fun expandBufferAndConvert(seconds: Double, prompt: String): String {
		recorder.pullNextSeconds(seconds)
		// Also pull any extra available data, in case the speech-to-text converter
		// is lagging behind the audio recorder.
		recorder.pullAvailable()

		return convert(recorder.bufferedData, prompt)
	}

	// Converts as many seconds of buffered data as possible, without waiting
	fun expandBufferAndConvert(prompt: String): String {
		recorder.pullAvailable()
		return convert(recorder.bufferedData, prompt)
	}

	override fun close() {
		Log.d("Whisper", "Close")
		recorder.close()
		NativeWhsiperLib.free(whisper)
	}
}