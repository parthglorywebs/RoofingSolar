package com.roofingsolar.RNUploader

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.atomic.AtomicInteger

class MyBackgroundService : Service() {

    companion object {
        const val TAG = "MyBackgroundService"
        const val CHANNEL_ID = "upload_channel"
        const val NOTIFICATION_ID = 1001
        var currentService: MyBackgroundService? = null
    }

    private lateinit var notificationManager: NotificationManager
    private lateinit var notificationBuilder: NotificationCompat.Builder

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    private val resizeMap = mapOf(
        "small" to Pair(80, 80),
        "thumbnail" to Pair(218, 210),
        "gallery" to Pair(1900, 1900),
        "pdfimage" to Pair(600, 450),
        "original" to null
    )

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "✅ Service started")

        currentService = this
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Uploading")
            .setContentText("Preparing upload...")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setStyle(NotificationCompat.BigTextStyle())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notificationBuilder.build(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notificationBuilder.build())
        }

        val fileListJson = intent?.getStringExtra("fileList")
        if (fileListJson.isNullOrEmpty()) {
            Log.e(TAG, "❌ No file list provided, stopping service")
            stopSelf()
            return START_NOT_STICKY
        }

        serviceScope.launch {
            try {
                val fileArray = JSONArray(fileListJson)
                val totalFiles = fileArray.length()
                val uploadedFileCount = AtomicInteger(0)

                fun getFileNameFromUrl(url: String): String {
                    val cleanUrl = url.substringBefore('?')
                    return cleanUrl.substringAfterLast('/')
                }

                for (i in 0 until totalFiles) {
                    val fileObj = fileArray.getJSONObject(i)

                    val originalFileUrl = fileObj.getString("fileUrl")
                    val projectId = fileObj.getString("projectId")
                    val accessToken = fileObj.getString("accessToken")
                    val fileName = File(originalFileUrl).name
                    val currentFile = File(originalFileUrl)
                    val mediaVariants = JSONArray()

                    val remainingFiles = totalFiles - uploadedFileCount.get()

                    withContext(Dispatchers.Main) {
                        updateNotification(
                            title = "Uploading: $fileName",
                            message = "File ${i + 1}/$totalFiles ($fileName)\nProgress: 0%\nUploaded Files: ${uploadedFileCount.get()}, Remaining: $remainingFiles",
                            progress = 0,
                            ongoing = true
                        )
                    }

                    val presignedArray = fileObj.getJSONArray("presignedUrl")
                    for (j in 0 until presignedArray.length()) {
                        val presignedObj = presignedArray.getJSONObject(j)
                        val type = presignedObj.getString("type")
                        val key = presignedObj.getString("key")
                        val uploadUrl = presignedObj.getString("url")

                        val uploadFile = if (key == "thumb_video_image") {
                            generateVideoThumbnail(currentFile) ?: currentFile
                        } else {
                            val size = resizeMap[type]
                            if (
                                size != null &&
                                currentFile.extension.lowercase() in listOf("jpg", "jpeg", "png")
                            ) {
                                resizeImage(currentFile, size.first, size.second) ?: currentFile
                            } else {
                                currentFile
                            }
                        }

                        val uploadResult = CompletableDeferred<Boolean>()

                        var lastUpdateTime = System.currentTimeMillis()
                        var lastUploadedBytes = 0L
                        val speedWindow = mutableListOf<Long>()

                        S3Uploader.uploadToS3(
                            fileUri = uploadFile.absolutePath,
                            mimeType = type,
                            presignedUrl = uploadUrl,
                            onProgress = { bytesUploaded, totalBytes ->
                                val currentTime = System.currentTimeMillis()
                                val elapsedTime = currentTime - lastUpdateTime
                                if (elapsedTime >= 1000) {
                                    val deltaBytes = bytesUploaded - lastUploadedBytes
                                    val speedBps = if (elapsedTime > 0) (deltaBytes * 1000 / elapsedTime) else 0L

                                    speedWindow.add(speedBps)
                                    if (speedWindow.size > 5) speedWindow.removeAt(0)
                                    val averageSpeed = speedWindow.average().toLong()

                                    val progressPercent = (bytesUploaded * 100 / totalBytes).toInt()

                                    serviceScope.launch(Dispatchers.Main) {
                                        val uploadedCount = uploadedFileCount.get()
                                        val remaining = totalFiles - uploadedCount
                                        updateNotification(
                                            title = "Uploading: $key - $fileName \n" +
                                                    "Progress: $progressPercent%",
                                            message = "File ${i + 1}/$totalFiles ($fileName)\nUploaded Files: $uploadedCount, Remaining: $remaining\nSpeed: ${formatSpeed(averageSpeed)}",
                                            progress = progressPercent,
                                            ongoing = true
                                        )
                                    }

                                    lastUpdateTime = currentTime
                                    lastUploadedBytes = bytesUploaded
                                }
                            },
                            onSuccess = {
                                Log.d(TAG, "✅ Upload succeeded: ${uploadFile.name}")
                                val fileSize = uploadFile.length()
                                val mediaVariant = JSONObject()
                                mediaVariant.put("key", key)
                                mediaVariant.put("filename", getFileNameFromUrl(uploadUrl))
                                mediaVariant.put("type", type)
                                mediaVariant.put("size", fileSize)
                                mediaVariants.put(mediaVariant)
                                uploadResult.complete(true)
                            },
                            onFailure = { error ->
                                Log.e(TAG, "❌ Upload failed: ${uploadFile.name}", error)
                                uploadResult.complete(false)
                            }
                        )

                        val success = uploadResult.await()

                        if (uploadFile != currentFile) {
                            uploadFile.delete()
                        }

                        if (!success) {
                            withContext(Dispatchers.Main) {
                                updateNotification("Upload failed", "Failed to upload $fileName", progress = null, ongoing = false)
                            }
                            stopForeground(true)
                            stopSelf()
                            return@launch
                        }
                    }

                    if (mediaVariants.length() > 0) {
                        S3Uploader.storeMetadata(
                            projectId,
                            mediaVariants,
                            accessToken,
                            onSuccess = {
                                Log.d(TAG, "✅ Metadata stored successfully")
                            },
                            onFailure = {
                                Log.e(TAG, "❌ Failed to store metadata", it)
                            }
                        )
                    } else {
                        Log.w(TAG, "⚠️ No media variants to store for projectId: $projectId")
                    }

                    if (currentFile.exists()) {
                        val deleted = currentFile.delete()
                        Log.d(TAG, if (deleted) "🗑️ File deleted" else "⚠️ Failed to delete file")
                    }

                    uploadedFileCount.incrementAndGet()

                    withContext(Dispatchers.Main) {
                        updateNotification(
                            title = "Uploaded: $fileName",
                            message = "File ${i + 1}/$totalFiles ($fileName) uploaded successfully\nUploaded Files: ${uploadedFileCount.get()}, Remaining: ${totalFiles - uploadedFileCount.get()}",
                            progress = null,
                            ongoing = true
                        )
                    }
                }

                withContext(Dispatchers.Main) {
                    updateNotification("Upload Complete", "All files uploaded successfully", progress = null, ongoing = false)

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        stopForeground(Service.STOP_FOREGROUND_DETACH)
                    } else {
                        stopForeground(false)
                    }
                }

                stopSelf()

            } catch (e: Exception) {
                Log.e(TAG, "❌ Upload error", e)
                withContext(Dispatchers.Main) {
                    updateNotification("Upload failed", e.message ?: "Unknown error", progress = null, ongoing = false)
                }
                stopForeground(true)
                stopSelf()
            }
        }

        return START_STICKY
    }

    private fun updateNotification(title: String, message: String, progress: Int? = null, ongoing: Boolean) {
        notificationBuilder.setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setOngoing(ongoing)

        // Change icon based on whether it's still uploading or completed
        if (ongoing) {
            notificationBuilder.setSmallIcon(android.R.drawable.stat_sys_upload)
        } else {
            notificationBuilder.setSmallIcon(android.R.drawable.stat_sys_upload_done)
        }

        if (progress != null && progress in 0..100) {
            notificationBuilder.setProgress(100, progress, false)
        } else {
            notificationBuilder.setProgress(0, 0, false)
        }

        notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build())
    }

    private fun formatSpeed(bytesPerSecond: Long): String {
        return when {
            bytesPerSecond >= 1_000_000 -> String.format("%.2f MB/s", bytesPerSecond / 1_000_000.0)
            bytesPerSecond >= 1_000 -> String.format("%.2f KB/s", bytesPerSecond / 1_000.0)
            else -> "$bytesPerSecond B/s"
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "🛑 Service destroyed")
        serviceJob.cancel()
        currentService = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun resizeImage(file: File, width: Int, height: Int): File? {
        return try {
            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
            val resizedBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
            val tempFile = File.createTempFile("resized_", ".jpg", file.parentFile)
            tempFile.outputStream().use {
                resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 90, it)
            }
            tempFile
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error resizing image: ${file.name}", e)
            null
        }
    }

    private fun generateVideoThumbnail(videoFile: File): File? {
        return try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(videoFile.absolutePath)
            val frame = retriever.getFrameAtTime(1, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
            retriever.release()

            if (frame != null) {
                val thumbFile = File.createTempFile("thumb_video_", ".jpg", videoFile.parentFile)
                thumbFile.outputStream().use {
                    frame.compress(Bitmap.CompressFormat.JPEG, 90, it)
                }
                thumbFile
            } else {
                Log.e(TAG, "❌ No frame extracted from video: ${videoFile.name}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to generate thumbnail for video: ${videoFile.name}", e)
            null
        }
    }
}
