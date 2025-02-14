package net.cozic.joplin.audio

import android.content.Context
import java.io.Closeable

typealias AudioStreamFactory = (context: Context)->AudioStreamSource

abstract class AudioStreamSource : Closeable {
    protected val sampleRate = 16_000
    private val maxLengthSeconds = 30 // Whisper supports a maximum of 30s
    protected val maxBufferSize = sampleRate * maxLengthSeconds

    abstract val bufferedData: FloatArray
    abstract val bufferLengthSeconds: Double
    abstract fun dropFirstSeconds(seconds: Double)
    abstract fun start()
    abstract fun pullAvailable()
    abstract fun pullNextSeconds(seconds: Double)
}