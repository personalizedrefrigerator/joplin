package net.cozic.joplin.auth

import android.database.Cursor
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import androidx.core.net.toUri


// Handles inter-process communication with other apps.
class AuthPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf<NativeModule>(IpcPackage(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    class IpcPackage(
        private var context: ReactApplicationContext,
    ) : ReactContextBaseJavaModule(context) {

        override fun getName() = "AppAuthModule"


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
                    // This should be the case for most devices: No authentication secret
                    // provider app was found. Use "null" for the secret.
                    promise.resolve(null)
                    return
                }

                if (cursor.moveToFirst()) {
                    val value = cursor.getString(0)
                    promise.resolve(value)
                } else {
                    promise.reject(Exception("No client secret was returned"))
                }
            } catch (exception: Throwable) {
                promise.reject(exception)
            } finally {
                cursor?.close()
            }
        }

    }
}