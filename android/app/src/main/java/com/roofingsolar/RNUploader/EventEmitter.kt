package com.roofingsolar.RNUploader
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

object EventEmitter {
    var reactContext: ReactApplicationContext? = null

    fun sendEvent(eventName: String, params: WritableMap) {
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }

    fun sendEvent(eventName: String, message: String) {
        val map = Arguments.createMap()
        map.putString("message", message)
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, map)
    }
}

