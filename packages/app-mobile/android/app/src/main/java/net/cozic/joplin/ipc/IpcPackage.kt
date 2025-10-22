package net.cozic.joplin.ipc

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.widget.Toast
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
import androidx.core.net.toUri


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
    ) : ReactContextBaseJavaModule(context) {

        override fun getName() = "AppIpcModule"


        @ReactMethod
        fun requestAppSecret(promise: Promise) {
            var cursor: Cursor? = null
            try {
                cursor = context.contentResolver.query(
                    "content://net.cozic.joplin-key.auth-client-secret".toUri(),
                    arrayOf("secret"),
                    null,
                    emptyArray<String>(),
                    ""
                )
                if (cursor == null) {
                    promise.reject(Exception("Failed to resolve app secret"))
                    return
                }
                if (cursor.moveToFirst()) {
                    val value = cursor.getString(0)
                    promise.resolve(value)
                } else {
                    promise.reject(Exception("No data"))
                }
            } catch (exception: Throwable) {
                promise.reject(exception)
            } finally {
                cursor?.close()
            }
        }

    }
}