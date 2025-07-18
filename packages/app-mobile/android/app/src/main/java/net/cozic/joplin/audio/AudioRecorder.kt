package net.cozic.joplin.audio

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder.AudioSource
import java.io.Closeable
import kotlin.math.max
import kotlin.math.min

typealias AudioRecorderFactory = (context: Context)->AudioRecorder;

class AudioRecorder(context: Context) : Closeable {
	private val sampleRate = 16_000
	// Don't allow the unprocessed audio buffer to grow indefinitely -- discard
	// data if longer than this:
	private val maxLengthSeconds = 120
	private val maxRecorderBufferLengthSeconds = 20
	private val maxBufferSize = sampleRate * maxLengthSeconds
	private val buffer = FloatArray(maxBufferSize)
	private var bufferWriteOffset = 0

	// Accessor must not modify result
	private val bufferedData: FloatArray get() = buffer.sliceArray(0 until bufferWriteOffset)
	val bufferLengthSeconds: Double get() = bufferWriteOffset.toDouble() / sampleRate

	init {
		val permissionResult = context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
		if (permissionResult == PackageManager.PERMISSION_DENIED) {
			throw SecurityException("Missing RECORD_AUDIO permission!")
		}
	}

	// Permissions check is included above
	@SuppressLint("MissingPermission")
	private val recorder = AudioRecord.Builder()
		.setAudioSource(AudioSource.MIC)
		.setAudioFormat(
			AudioFormat.Builder()
				// PCM: A WAV format
				.setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
				.setSampleRate(sampleRate)
				.setChannelMask(AudioFormat.CHANNEL_IN_MONO)
				.build()
		)
		.setBufferSizeInBytes(maxRecorderBufferLengthSeconds * sampleRate * Float.SIZE_BYTES)
		.build()

	// Discards the first [samples] samples from the start of the buffer. Conceptually, this
	// advances the buffer's start point.
	private fun advanceStartBySamples(samples: Int) {
		val samplesClamped = min(samples, maxBufferSize)
		val remainingBuffer = buffer.sliceArray(samplesClamped until maxBufferSize)

		buffer.fill(0f, samplesClamped, maxBufferSize)
		remainingBuffer.copyInto(buffer, 0)
		bufferWriteOffset = max(bufferWriteOffset - samplesClamped, 0)
	}

	fun dropFirstSeconds(seconds: Double) {
		advanceStartBySamples((seconds * sampleRate).toInt())
	}

	fun start() {
		recorder.startRecording()
	}

	private fun read(requestedSize: Int, mode: Int) {
		val size = min(requestedSize, maxBufferSize - bufferWriteOffset)
		val sizeRead = recorder.read(buffer, bufferWriteOffset, size, mode)
		if (sizeRead > 0) {
			bufferWriteOffset += sizeRead
		}
	}

	// Pulls all available data from the audio recorder's buffer
	fun pullAvailable(): FloatArray {
		read(maxBufferSize, AudioRecord.READ_NON_BLOCKING)

		val result = bufferedData
		buffer.fill(0.0f, 0, maxBufferSize);
		bufferWriteOffset = 0
		return result
	}

	fun pullNextSeconds(seconds: Double):FloatArray {
		val remainingSize = maxBufferSize - bufferWriteOffset
		val requestedSize = (seconds * sampleRate).toInt()

		// If low on size, make more room.
		if (remainingSize < maxBufferSize / 3) {
			advanceStartBySamples(maxBufferSize / 3)
		}

		read(requestedSize, AudioRecord.READ_BLOCKING)
		return pullAvailable()
	}

	override fun close() {
		recorder.stop()
		recorder.release()
	}

	companion object {
		val factory: AudioRecorderFactory = { context -> AudioRecorder(context) }
	}
}