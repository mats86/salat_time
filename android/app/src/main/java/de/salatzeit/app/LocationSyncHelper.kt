package de.salatzeit.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

object LocationSyncHelper {
    fun hasPermission(context: Context): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    fun syncFromDevice(context: Context) {
        if (!hasPermission(context)) return

        val appContext = context.applicationContext
        val prefs = WidgetPreferences(appContext)
        val fusedClient = LocationServices.getFusedLocationProviderClient(appContext)

        fusedClient.lastLocation
            .addOnSuccessListener { location ->
                if (location != null) {
                    prefs.saveLocationEverywhere(location.latitude, location.longitude)
                    PrayerWidgetUpdater.updateAll(appContext, forceRefresh = true)
                }
            }
            .addOnFailureListener {
                // Ignore – widget will retry on next schedule.
            }
    }

    suspend fun fetchDeviceLocation(context: Context): StoredLocation? {
        if (!hasPermission(context)) return null

        val prefs = WidgetPreferences(context.applicationContext)
        val fusedClient = LocationServices.getFusedLocationProviderClient(context.applicationContext)

        return try {
            val last = fusedClient.lastLocation.await()
            if (last != null) {
                val stored = StoredLocation(last.latitude, last.longitude)
                prefs.saveLocationEverywhere(stored.lat, stored.lng)
                return stored
            }

            val current = fusedClient.getCurrentLocation(
                Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                CancellationTokenSource().token,
            ).await()

            if (current != null) {
                val stored = StoredLocation(current.latitude, current.longitude)
                prefs.saveLocationEverywhere(stored.lat, stored.lng)
                stored
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }
}
