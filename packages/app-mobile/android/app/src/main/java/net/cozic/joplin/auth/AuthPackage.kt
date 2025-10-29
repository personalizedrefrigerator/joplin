package net.cozic.joplin.auth

import android.database.Cursor
import android.net.Uri
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
        return listOf<NativeModule>(AuthModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    class AuthModule(
        private var context: ReactApplicationContext,
    ) : ReactContextBaseJavaModule(context) {

        override fun getName() = "AppAuthModule"

        private fun requestSecret(secretUri: Uri, serverUri: String, promise: Promise) {
            var cursor: Cursor? = null
            try {
                val client = context.contentResolver.acquireContentProviderClient(secretUri)
                client?.
                cursor = context.contentResolver.query(
                    secretUri,
                    arrayOf("secret"),
                    "server = ?",
                    arrayOf(serverUri),
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

        @ReactMethod
        fun requestAppSecret(serverUri: String, promise: Promise) {
            requestSecret("content://net.cozic.joplin-key.auth-client-secret".toUri(), serverUri, promise)
        }

        @ReactMethod
        fun requestDeviceSecret(serverUri: String, promise: Promise) {
            requestSecret("content://net.cozic.joplin-key.auth-device-secret".toUri(), serverUri, promise)
        }

    }
}