package com.roofingsolar.RNUploader

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MyServiceModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "MyServiceModule"
        const val CHANNEL_ID = "upload_channel"
        const val NOTIFICATION_ID = 1001
    }

    init {
        EventEmitter.reactContext = reactContext
    }


    private val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    override fun getName() = "MyServiceModule"

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "File Upload", NotificationManager.IMPORTANCE_LOW)
            notificationManager.createNotificationChannel(channel)
            Log.d(TAG, "Notification channel created")
        }
    }

    // 👇 ADD THESE TWO METHODS
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter. No implementation needed.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter. No implementation needed.
    }

    @ReactMethod
    fun startBackgroundService(fileList: ReadableArray, promise: Promise) {
        try {
            createNotificationChannel()

            val jsonArray = org.json.JSONArray()
            for (i in 0 until fileList.size()) {
                val map = fileList.getMap(i)
                val obj = org.json.JSONObject()
                obj.put("fileUrl", map?.getString("fileUrl"))
                obj.put("projectId", map?.getString("projectId"))
                obj.put("accessToken", map?.getString("accessToken"))

                val presignedUrls = org.json.JSONArray()
                map?.getArray("presignedUrl")?.let { presignedArray ->
                    for (j in 0 until presignedArray.size()) {
                        val urlMap = presignedArray.getMap(j)
                        val urlObj = org.json.JSONObject()
                        urlObj.put("type", urlMap?.getString("type"))
                        urlObj.put("url", urlMap?.getString("url"))
                        urlObj.put("key", urlMap?.getString("key"))
                        presignedUrls.put(urlObj)
                    }
                }

                obj.put("presignedUrl", presignedUrls)
                jsonArray.put(obj)
            }

            val intent = Intent(reactContext, MyBackgroundService::class.java)
            intent.putExtra("fileList", jsonArray.toString())

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }

            promise.resolve("Service started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start service", e)
            promise.reject("SERVICE_ERROR", "Failed to start service", e)
        }
    }

    @ReactMethod
    fun notifyProgress(file: String, status: String) {
        Log.d(TAG, "Updating notification: $file -> $status")
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(reactContext, CHANNEL_ID)
        } else {
            Notification.Builder(reactContext)
        }

        val notification = builder
            .setContentTitle("Uploading Files")
            .setContentText("File: $file Status: $status")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    @ReactMethod
    fun clearNotification() {
        notificationManager.cancel(NOTIFICATION_ID)
    }

}
