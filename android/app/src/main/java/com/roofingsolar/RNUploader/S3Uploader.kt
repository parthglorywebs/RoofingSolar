package com.roofingsolar.RNUploader
import okhttp3.*
import java.io.File
import java.io.IOException
import android.util.Log
import java.util.concurrent.TimeUnit
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONArray

object S3Uploader {

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    fun uploadToS3(
        fileUri: String,
        mimeType: String,
        presignedUrl: String,
        onProgress: (bytesUploaded: Long, totalBytes: Long) -> Unit,
        onSuccess: () -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        try {
            val file = File(fileUri)
            if (!file.exists()) {
                throw IOException("File does not exist: $fileUri")
            }

            val mediaType = mimeType.toMediaTypeOrNull()
            val progressBody = ProgressRequestBody(file, mediaType, onProgress)

            val request = Request.Builder()
                .url(presignedUrl)
                .put(progressBody)
                .addHeader("Content-Type", mimeType)
                .build()

            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    Log.e("S3Uploader", "❌ Upload failed: ${e.message}", e)
                    onFailure(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    if (response.isSuccessful) {
                        Log.d("S3Uploader", "✅ Upload succeeded to $presignedUrl")
                        onSuccess()
                    } else {
                        val errMsg = "Upload failed with status: ${response.code}"
                        Log.e("S3Uploader", "❌ $errMsg")
                        onFailure(IOException(errMsg))
                    }
                    response.close()
                }
            })
        } catch (e: Exception) {
            Log.e("S3Uploader", "❌ Unexpected error: ${e.message}", e)
            onFailure(e)
        }
    }

    fun storeMetadata(
        projectId: String,
        mediaVariants: JSONArray,
        accessToken: String,
        onSuccess: (String) -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        val formBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
        formBodyBuilder.addFormDataPart("project_id", projectId)
        formBodyBuilder.addFormDataPart("uuid", "59d09068-6f3d-482d-b166-fc29a8a13b31")

        for (i in 0 until mediaVariants.length()) {
            val variant = mediaVariants.getJSONObject(i)
            formBodyBuilder.addFormDataPart("media_variants[$i][key]", variant.optString("key", ""))
            formBodyBuilder.addFormDataPart("media_variants[$i][filename]", variant.optString("filename", ""))
            formBodyBuilder.addFormDataPart("media_variants[$i][type]", variant.optString("type", ""))
            formBodyBuilder.addFormDataPart("media_variants[$i][size]", variant.optString("size", "0"))
        }

        val requestBody = formBodyBuilder.build()

        val request = Request.Builder()
            .url("http://13.56.14.87/api/contractor/store-metadata") // 🔁 Replace with config.baseUrl if available
            .post(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("S3Uploader", "❌ Failed to store metadata: ${e.message}", e)
                onFailure(e)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val responseData = response.body?.string() ?: ""
                        Log.d("S3Uploader", "✅ Metadata stored successfully: $responseData")
                        onSuccess(responseData)
                    } else {
                        val err = IOException("Failed to store metadata: ${response.code}")
                        Log.e("S3Uploader", "❌ $err")
                        onFailure(err)
                    }
                }
            }
        })
    }
}
