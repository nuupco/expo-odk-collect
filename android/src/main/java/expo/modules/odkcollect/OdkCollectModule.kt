package expo.modules.odkcollect

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Intent
import android.net.Uri
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import expo.modules.kotlin.exception.CodedException

const val REQUEST_PICK_FORM = 2001
const val REQUEST_PICK_INSTANCE = 2002
const val REQUEST_EDIT_INSTANCE = 2003

class OdkCollectModule : Module() {

    private val context
        get() = requireNotNull(appContext.reactContext)

    private val currentActivity: Activity
        get() = appContext.activityProvider?.currentActivity
            ?: throw CodedException("Activity not available")

    override fun definition() = ModuleDefinition {
        Name("OdkCollect")

        Events("onActivityResult", "onError")

        // -------- PUBLIC API --------

        Function("isInstalled") {
            isCollectInstalled()
        }

        Function("launchCollect") {
            launchCollect()
        }

        Function("isOpenedByOdk") {
            isOpenedByOdk()
        }

        Function("openFormsList") {
            openFormsList()
        }

        Function("openInstancesList") {
            openInstancesList()
        }

        Function("pickForm") {
            pickForm()
        }

        Function("pickInstance") {
            pickInstance()
        }

        Function("editInstance") { instanceId: String ->
            editInstance(instanceId)
        }

        Function("getForms") {
            queryForms()
        }

        Function("getInstances") {
            queryInstances()
        }

        Function("getIntentExtras") {
            getIntentExtras()
        }

        Function("returnResult") { data: Map<String, Any> ->
            returnResult(data)
        }

        // -------- ACTIVITY RESULT --------

        OnActivityResult { activity, payload ->
            val data = payload.data
            val resultCode = payload.resultCode
            val requestCode = payload.requestCode

            val result = Bundle().apply {
                putInt("requestCode", requestCode)
                putInt("resultCode", resultCode)
                putString("uri", data?.data?.toString() ?: "")
            }

            sendEvent("onActivityResult", result)
        }
    }

    // -------- HELPERS --------

    private fun isCollectInstalled(): Boolean = try {
        context.packageManager.getPackageInfo("org.odk.collect.android", 0)
        true
    } catch (e: Exception) {
        false
    }

    private fun startIntent(intent: Intent, requestCode: Int? = null) {
        if (!isCollectInstalled()) {
            sendError("ODK_NOT_INSTALLED", "ODK Collect not installed")
            return
        }

        if (intent.resolveActivity(context.packageManager) == null) {
            sendError("ACTIVITY_NOT_FOUND", "No activity found for intent")
            return
        }

        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

        if (requestCode != null) {
            currentActivity.startActivityForResult(intent, requestCode)
        } else {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }

    private fun sendError(code: String, message: String) {
        val bundle = Bundle().apply {
            putString("code", code)
            putString("message", message)
        }
        sendEvent("onError", bundle)
    }

    // -------- INTENTS --------

    private fun launchCollect() {
        val intent = context.packageManager
            .getLaunchIntentForPackage("org.odk.collect.android")

        if (intent == null) {
            sendError("ODK_NOT_INSTALLED", "ODK Collect not installed")
            return
        }

        context.startActivity(intent)
    }

    private fun openFormsList() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            type = "vnd.android.cursor.dir/vnd.odk.form"
        }
        startIntent(intent)
    }

    private fun openInstancesList() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            type = "vnd.android.cursor.dir/vnd.odk.instance"
        }
        startIntent(intent)
    }

    private fun pickForm() {
        val intent = Intent(Intent.ACTION_PICK).apply {
            type = "vnd.android.cursor.dir/vnd.odk.form"
        }
        startIntent(intent, REQUEST_PICK_FORM)
    }

    private fun pickInstance() {
        val intent = Intent(Intent.ACTION_PICK).apply {
            type = "vnd.android.cursor.dir/vnd.odk.instance"
        }
        startIntent(intent, REQUEST_PICK_INSTANCE)
    }

    private fun editInstance(instanceId: String) {
        val uri = Uri.parse(
            "content://org.odk.collect.android.provider.odk.instances/instances/$instanceId"
        )

        val intent = Intent(Intent.ACTION_EDIT).apply {
            data = uri
        }

        startIntent(intent, REQUEST_EDIT_INSTANCE)
    }

    // -------- CONTENT PROVIDERS --------

    private fun queryForms(): List<Map<String, Any>> {
        val uri = Uri.parse(
            "content://org.odk.collect.android.provider.odk.forms/forms"
        )

        return query(uri)
    }

    private fun queryInstances(): List<Map<String, Any>> {
        val uri = Uri.parse(
            "content://org.odk.collect.android.provider.odk.instances/instances"
        )

        return query(uri)
    }

    private fun query(uri: Uri): List<Map<String, Any>> {
        val result = mutableListOf<Map<String, Any>>()

        try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val columns = cursor.columnNames

                while (cursor.moveToNext()) {
                    val row = mutableMapOf<String, Any>()

                    for (col in columns) {
                        val index = cursor.getColumnIndex(col)
                        if (index >= 0) {
                            row[col] = cursor.getString(index) ?: ""
                        }
                    }

                    result.add(row)
                }
            }
        } catch (e: Exception) {
            sendError("QUERY_FAILED", e.message ?: "Unknown error")
        }

        return result
    }

    // -------- INTENT DATA --------

    private fun getIntentExtras(): Map<String, Any> {
        val extras = currentActivity.intent?.extras ?: return emptyMap()

        return extras.keySet().associateWith { key ->
            extras.get(key)?.toString() ?: ""
        }
    }

    private fun isOpenedByOdk(): Boolean {
        currentActivity.referrer?.toString()?.let { referrer ->
            return referrer.contains("org.odk.collect.android")
        }
        return false
    }

    // -------- RETURN TO ODK --------

    private fun returnResult(data: Map<String, Any>) {
        val intent = Intent()

        data.forEach { (key, value) ->
            intent.putExtra(key, value.toString())
        }

        currentActivity.setResult(Activity.RESULT_OK, intent)
        currentActivity.finish()
    }


}