package net.cozic.joplin.ipc

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContract

class SecretRequestContract : ActivityResultContract<String, String?>() {
    override fun createIntent(context: Context, input: String) =
        Intent().apply {
            action = "net.cozic.joplin.KEY_REQUEST"
            component = ComponentName("com.example.secretkeyresponder", ".SecretResolution")
        }

    override fun parseResult(resultCode: Int, intent: Intent?): String? {
        if (resultCode != Activity.RESULT_OK) {
            return null
        }
        return intent?.getStringExtra("net.cozic.joplin-key.secret")
    }
}