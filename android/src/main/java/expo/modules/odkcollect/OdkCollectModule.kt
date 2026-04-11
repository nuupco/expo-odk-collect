package expo.modules.odkcollect

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Intent
import android.net.Uri
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import expo.modules.kotlin.exception.CodedException

const val EDIT_FORM_REQUEST_CODE = 1001

class OdkCollectModule : Module() {

    private val context
        get() = requireNotNull(appContext.reactContext)

    private val currentActivity
        get() = appContext.activityProvider?.currentActivity
            ?: throw CodedException("Activity which was provided during module initialization is no longer available")

    override fun definition() = ModuleDefinition {
        Name("OdkCollect")

        Events("onChange", "onError")

        Function("returnResult") { datos: Map<String, Any> ->
            returnMultipleData(datos)
        }

        Function("getForms") {
            getForms()
        }

        Function("openOdkForms") {
            openOdkForms()
        }

        Function("startODKCollect") {
            startODKCollect()
        }

        Function("startInstanceUploaderList") {
            startInstanceUploaderList()
        }

        Function("getCurrentODKid") {
            getCurrentODKid()
        }

        Function("checkIfopenByODKform") {
            checkIfopenByODKform()
        }

        Function("getIntentExtra") { key: String ->
            getIntentExtra(key)
        }

        Function("getIntentExtras") {
            getIntentExtras()
        }

        Function("editODKInstance") { instanceId: String ->
            editODKInstance(instanceId)
        }

        Function("sendODKInstance") { instanceId: String, serverUrl: String ->
            sendODKInstance(instanceId, serverUrl)
        }
    }

    // --- Private helpers ---

    private fun bundleOf(vararg pairs: Pair<String, String>): Bundle =
        Bundle().apply { pairs.forEach { (k, v) -> putString(k, v) } }

    private fun isCollectAppInstalled(): Boolean = try {
        context.packageManager.getPackageInfo("org.odk.collect.android", 0)
        true
    } catch (e: PackageManager.NameNotFoundException) {
        false
    }

    private fun isActivityAvailable(intent: Intent): Boolean =
        context.packageManager
            .queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
            .isNotEmpty()

    private fun startActivityIfAvailable(intent: Intent) {
        when {
            !isCollectAppInstalled() -> sendEvent(
                "onError",
                bundleOf(
                    "code" to "ODK_NOT_INSTALLED",
                    "message" to "ODK Collect app is not installed on this device"
                )
            )
            !isActivityAvailable(intent) -> sendEvent(
                "onError",
                bundleOf(
                    "code" to "ACTIVITY_NOT_AVAILABLE",
                    "message" to "No activity available to handle this intent"
                )
            )
            else -> context.startActivity(intent)
        }
    }

    private fun openOdkForms() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            type = "vnd.android.cursor.dir/vnd.odk.form"
        }
        startActivityIfAvailable(intent)
    }

    private fun startODKCollect() {
        val intent = context.packageManager.getLaunchIntentForPackage("org.odk.collect.android")
        if (!isCollectAppInstalled() || intent == null) {
            sendEvent(
                "onError",
                bundleOf(
                    "code" to "ODK_NOT_INSTALLED",
                    "message" to "ODK Collect app is not installed on this device"
                )
            )
            return
        }
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        context.startActivity(intent)
    }

    private fun startInstanceUploaderList() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            type = "vnd.android.cursor.dir/vnd.odk.instance"
        }
        startActivityIfAvailable(intent)
    }

    private fun getForms(): List<Map<String, Any>> {
        if (!isCollectAppInstalled()) {
            sendEvent(
                "onError",
                bundleOf(
                    "code" to "ODK_NOT_INSTALLED",
                    "message" to "ODK Collect app is not installed on this device"
                )
            )
            return emptyList()
        }

        val uri = Uri.parse("content://org.odk.collect.android.provider.odk.instances/instances")
        val result = mutableListOf<Map<String, Any>>()

        try {
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                while (it.moveToNext()) {
                    result.add(
                        mapOf(
                            "_id"         to (it.getString(it.getColumnIndex("_id")) ?: "0"),
                            "displayName" to (it.getString(it.getColumnIndex("displayName")) ?: "-"),
                            "jrFormId"    to (it.getString(it.getColumnIndex("jrFormId")) ?: "-"),
                            "jrVersion"   to (it.getString(it.getColumnIndex("jrVersion")) ?: "-"),
                            "status"      to (it.getString(it.getColumnIndex("status")) ?: "unknown"),
                            "date"        to (it.getString(it.getColumnIndex("date")) ?: ""),
                            "deletedDate" to (it.getString(it.getColumnIndex("deletedDate")) ?: "")
                        )
                    )
                }
            }
        } catch (err: Exception) {
            Log.e("OdkCollectModule", "getForms error: $err")
            val payload = Bundle().apply {
                putString("code", "FORMS_QUERY_FAILED")
                putString("message", "Could not query ODK Collect instances")
                putString("details", err.toString())
            }
            sendEvent("onError", payload)
        }

        return result
    }

    private fun returnMultipleData(datos: Map<String, Any>) {
        val referrer = currentActivity.referrer?.toString() ?: ""
        if (referrer != "android-app://org.odk.collect.android") {
            sendEvent(
                "onError",
                bundleOf(
                    "code" to "ACTIVITY_NOT_AVAILABLE",
                    "message" to "returnResult must be called from an Activity opened by ODK Collect"
                )
            )
            return
        }

        val intent = Intent().apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TASK
            for ((key, value) in datos) {
                when (value) {
                    is String  -> putExtra(key, value)
                    is Int     -> putExtra(key, value)
                    is Long    -> putExtra(key, value)
                    is Double  -> putExtra(key, value)
                    is Boolean -> putExtra(key, value)
                    else       -> putExtra(key, value.toString())
                }
            }
        }
        currentActivity.setResult(Activity.RESULT_OK, intent)
        currentActivity.finish()
    }

    private fun checkIfopenByODKform(): String =
        currentActivity.referrer?.toString() ?: ""

    private fun getCurrentODKid(): String = getIntentExtra("uuid")

    private fun getIntentExtra(key: String): String =
        currentActivity.intent?.getStringExtra(key) ?: ""

    private fun getIntentExtras(): Map<String, Any> {
        val bundle = currentActivity.intent?.extras ?: return emptyMap()
        return bundle.keySet()
            .filter { bundle.get(it) != null }
            .associateWith { key ->
                when (val v = bundle.get(key)) {
                    is String  -> v
                    is Int     -> v
                    is Long    -> v
                    is Double  -> v
                    is Boolean -> v
                    else       -> v.toString()
                }
            }
    }

    private fun editODKInstance(instanceId: String) {
        val uri = Uri.parse(
            "content://org.odk.collect.android.provider.odk.instances/instances/$instanceId"
        )
        val intent = Intent(Intent.ACTION_EDIT).apply {
            data = uri
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        currentActivity.startActivityForResult(intent, EDIT_FORM_REQUEST_CODE)
    }

    private fun sendODKInstance(instanceId: String, serverUrl: String) {
        val intent = Intent("org.odk.collect.android.INSTANCE_UPLOAD").apply {
            type = "vnd.android.cursor.dir/vnd.odk.instance"
            putExtra("instances", arrayOf(instanceId))
            putExtra("URL", serverUrl)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivityIfAvailable(intent)
    }
}
