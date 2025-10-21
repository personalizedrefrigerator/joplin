package net.cozic.joplin.ipc

import android.content.ComponentName
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.ActivityResultRegistry
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import net.cozic.joplin.audio.SpeechToTextSessionManager
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// ref: https://developer.android.com/training/basics/intents/result#separate
class IpcLifecycleObserver(private val registry: ActivityResultRegistry) :
    DefaultLifecycleObserver {
    lateinit var getContent : ActivityResultLauncher<String>

    override fun onCreate(owner: LifecycleOwner) {
        getContent = registry.register<String, String>(
            "net.cozic.joplin.secret-key-request",
            owner,
            SecretRequestContract()
        ) { result ->
            // TODO: Process result
        }
    }

    fun requestKey() {
        getContent.launch("")
    }
}

// Handles inter-process communication with other apps.
class IpcPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf<NativeModule>(IpcPackage(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    class IpcPackage(
        private var context: ReactApplicationContext,
    ) : ReactContextBaseJavaModule(context), LifecycleEventListener {
        private var observer: IpcLifecycleObserver? = null

        override fun getName() = "AppIpcModule"

        override fun onHostResume() {
            val activity = context.currentActivity
            if (activity is AppCompatActivity) {
                val resultRegistry = activity.activityResultRegistry
                observer = observer ?: IpcLifecycleObserver(resultRegistry).also { observer ->
                    activity.lifecycle.addObserver(observer)
                }
            } else {
                throw Exception("Invalid state: The current activity must exist and must be an AppCompatActivity when the app resumes")
            }
        }
        override fun onHostPause() { }
        override fun onHostDestroy() { }

        @ReactMethod
        fun requestAppSecret(promise: Promise) {
            val appContext = context.applicationContext

            try {
                observer?.requestKey()
                promise.resolve(0)
            } catch (exception: Throwable) {
                promise.reject(exception)
            }
        }

    }
}