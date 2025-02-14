package net.cozic.joplin.audio

import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.util.Log
import java.nio.ByteBuffer
import java.nio.FloatBuffer
import java.nio.ShortBuffer
import kotlin.math.min

// See https://gist.github.com/a-m-s/1991ab18fbcb0fcc2cf9
//     https://github.com/radhoo/android-openmxplayer/blob/master/OpenMXPlayer/src/net/pocketmagic/android/openmxplayer/OpenMXPlayer.java
//     https://developer.android.com/reference/android/media/MediaExtractor
//     https://developer.android.com/reference/android/media/MediaCodec
class AudioFile(
    inputFilePath: String
) : AudioStreamSource() {
    private var slidingWindow = FloatArray(maxBufferSize)
    private var slidingWindowSize = 0

    private val extractor = MediaExtractor()
    private val decoder: MediaCodec = run {
        extractor.setDataSource(inputFilePath)
        var codec: MediaCodec? = null
        // See https://developer.android.com/reference/android/media/MediaExtractor
        for (i in 0..<extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME)
            if (mime != null && mime.startsWith("audio/")) {
                Log.d("AudioFile", String.format("Found track with MIME %s", mime));
                extractor.selectTrack(i)
                codec = MediaCodec.createDecoderByType(mime)

                // Set the buffer format to float16
                format.setInteger("pcm-encoding", AudioFormat.ENCODING_PCM_16BIT)
                codec.configure(format, null, null, 0)
                codec.start()
            }
        }
        if (codec == null) {
            throw Error("No valid format found")
        }
        codec
    }

    private var done = false
    private var currentBuffer: ShortBuffer = ShortBuffer.wrap(ShortArray(0))
    private var currentBufferIndex = -1
    private fun nextChunk(): Boolean {
        if (done) return false
        Log.d("AudioFile", "nextChunk")

        val timeout = 2_000_000L // µs
        val outputInfo = MediaCodec.BufferInfo()
        var outputBufferIndex = -1 // "Try again"
        while (outputBufferIndex == -1 || outputBufferIndex == -2) {
            Log.d("AudioFile", "pushData")

            val inputBufferIndex = decoder.dequeueInputBuffer(timeout)
            val buffer = decoder.getInputBuffer(inputBufferIndex)
            if (buffer != null) {
                val size = extractor.readSampleData(buffer, 0)
                if (size <= 0) {
                    Log.d("AudioFile", "EOF")
                    done = true
                    // EOF
                    decoder.queueInputBuffer(
                        inputBufferIndex,
                        0,
                        0,
                        extractor.sampleTime,
                        MediaCodec.BUFFER_FLAG_END_OF_STREAM
                    )
                    extractor.release()
                } else {
                    decoder.queueInputBuffer(
                        inputBufferIndex, 0, size, extractor.sampleTime, 0
                    )
                    extractor.advance()
                }
            }

            outputBufferIndex = decoder.dequeueOutputBuffer(outputInfo, timeout)
            if (outputBufferIndex == -2) {
                Log.i("AudioFile", "Format changed.")
                decoder.outputFormat.setInteger("pcm-encoding", AudioFormat.ENCODING_PCM_FLOAT)
            }
        }

        if (outputBufferIndex >= 0) {
            val outputBuffer = decoder.getOutputBuffer(outputBufferIndex)
            if (outputBuffer != null) {
                if (currentBufferIndex >= 0) {
                    decoder.releaseOutputBuffer(currentBufferIndex, false)
                }
                currentBufferIndex = outputBufferIndex
                currentBuffer = outputBuffer.asShortBuffer()
                return true
            }
        } else {
            Log.w("AudioFile", "Failed to get buffer done:$done,idx:$outputBufferIndex,sz:${outputInfo.size}")
        }
        return false
    }

    override fun pullAvailable() {
        // Not needed -- will be done on drop
    }

    override fun pullNextSeconds(seconds: Double) {
        dropFirstSeconds(1.0)
    }

    override fun dropFirstSeconds(seconds: Double) {
        val requestedSize = (seconds * sampleRate).toInt()
        val samplesClamped = min(requestedSize, maxBufferSize)

        // Rotate the buffer left by samplesClamped
        val remainingBuffer = slidingWindow.sliceArray(samplesClamped until maxBufferSize)
        slidingWindow.fill(0f, samplesClamped, maxBufferSize)
        remainingBuffer.copyInto(slidingWindow, 0)

        var spaceToFill = maxBufferSize - samplesClamped
        var fillOffset = samplesClamped

        Log.d("AudioFile", "dropFirstSeconds: $seconds seconds, $samplesClamped samples, $fillOffset offset")

        while (spaceToFill > 0 && !done) {
            val sizeAvailable = currentBuffer.remaining()
            val fillSize = min(spaceToFill, sizeAvailable)

            for (i in fillOffset ..< fillSize+fillOffset) {
                slidingWindow[i] = (currentBuffer.get().toFloat() / Short.MAX_VALUE.toFloat() - 0.5f) * 2f
            }

            spaceToFill -= fillSize
            fillOffset += fillSize
            slidingWindowSize = fillOffset
            Log.d("AudioFile", "Fill. Size remaining $spaceToFill, available $sizeAvailable, size done $fillSize, fill at $fillOffset.")

            if (currentBuffer.remaining() == 0) {
                if (!nextChunk()) {
                    break
                }
            }
        }
        Log.d("AudioFile", "done dropFirstSeconds: $slidingWindowSize")
    }

    override fun start() {
        dropFirstSeconds(0.0)
    }

    override fun close() {
        if (!done) {
            done = true
            decoder.release()
            extractor.release()
        }
    }

    // Accessor must not modify result
    override val bufferedData: FloatArray get() = slidingWindow.sliceArray(0 until slidingWindowSize)
    override val bufferLengthSeconds: Double get() = slidingWindowSize.toDouble() / sampleRate

    companion object {
        fun makeFactory(fileName: String): AudioStreamFactory = {
            AudioFile(fileName)
        }
    }
}