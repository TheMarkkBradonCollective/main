package com.themarkkbradoncollective.store

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

class MbcStoreBridge(
    private val activity: MainActivity,
    private val webView: WebView,
) {

    @JavascriptInterface
    fun isStoreApp(): String = "true"

    @JavascriptInterface
    fun canInstallPackages(): String {
        return if (activity.packageManager.canRequestPackageInstalls()) "true" else "false"
    }

    @JavascriptInterface
    fun requestInstallPermission() {
        activity.runOnUiThread { activity.requestInstallPermission() }
    }

    @JavascriptInterface
    fun getInstalledVersion(packageId: String): String? {
        if (packageId.isBlank()) return null
        return try {
            val info = activity.packageManager.getPackageInfo(packageId, 0)
            val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                info.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                info.versionCode.toLong()
            }
            JSONObject()
                .put("versionName", info.versionName ?: "")
                .put("versionCode", versionCode)
                .toString()
        } catch (_: PackageManager.NameNotFoundException) {
            null
        }
    }

    @JavascriptInterface
    fun openApp(packageId: String) {
        if (packageId.isBlank()) return
        activity.runOnUiThread {
            val launch = activity.packageManager.getLaunchIntentForPackage(packageId)
            if (launch != null) {
                activity.startActivity(launch)
            }
        }
    }

    @JavascriptInterface
    fun installApk(url: String, sha256: String?, installKey: String) {
        if (url.isBlank()) {
            notifyComplete(installKey, false, "Missing download URL.")
            return
        }
        Thread {
            try {
                val file = downloadApk(activity, url, sha256) { percent ->
                    notifyProgress(installKey, percent)
                }
                activity.runOnUiThread {
                    launchInstaller(activity, file)
                    notifyComplete(installKey, true, "Ready — confirm install on the Android screen.")
                }
            } catch (err: Exception) {
                notifyComplete(installKey, false, err.message ?: "Install failed.")
            }
        }.start()
    }

    private fun notifyProgress(installKey: String, percent: Int) {
        val safeKey = escapeJs(installKey)
        val js = "window.MbcStore && window.MbcStore._onProgress('$safeKey', $percent);"
        webView.post { webView.evaluateJavascript(js, null) }
    }

    private fun notifyComplete(installKey: String, success: Boolean, message: String) {
        val safeKey = escapeJs(installKey)
        val safeMsg = escapeJs(message)
        val js =
            "window.MbcStore && window.MbcStore._onComplete('$safeKey', ${success}, '$safeMsg');"
        webView.post { webView.evaluateJavascript(js, null) }
    }

    private fun escapeJs(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "")
    }

    private fun downloadApk(
        context: Context,
        url: String,
        expectedSha256: String?,
        onProgress: (Int) -> Unit,
    ): File {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 30000
            readTimeout = 120000
            instanceFollowRedirects = true
        }

        connection.connect()
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException("Download failed (HTTP ${connection.responseCode}).")
        }

        val total = connection.contentLengthLong.takeIf { it > 0 } ?: -1L
        val cacheDir = File(context.cacheDir, "apk").apply { mkdirs() }
        val outFile = File(cacheDir, "install-${System.currentTimeMillis()}.apk")

        connection.inputStream.use { input ->
            FileOutputStream(outFile).use { output ->
                val buffer = ByteArray(8192)
                var downloaded = 0L
                var read: Int
                while (input.read(buffer).also { read = it } != -1) {
                    output.write(buffer, 0, read)
                    downloaded += read
                    if (total > 0) {
                        val percent = ((downloaded * 100) / total).toInt().coerceIn(0, 99)
                        onProgress(percent)
                    }
                }
            }
        }
        connection.disconnect()

        onProgress(100)

        if (expectedSha256 != null && expectedSha256.isNotBlank()) {
            val actual = sha256Hex(outFile)
            if (!actual.equals(expectedSha256, ignoreCase = true)) {
                outFile.delete()
                throw IllegalStateException("SHA-256 mismatch — file may be corrupted.")
            }
        }

        if (outFile.length() < 50_000) {
            outFile.delete()
            throw IllegalStateException("Downloaded file is too small to be a valid APK.")
        }

        return outFile
    }

    private fun sha256Hex(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun launchInstaller(context: Context, apkFile: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile,
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
