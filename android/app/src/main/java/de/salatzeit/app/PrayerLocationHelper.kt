package de.salatzeit.app

import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.tasks.await

class PrayerLocationHelper(private val context: android.content.Context) {
    private val fusedClient = LocationServices.getFusedLocationProviderClient(context)
    private val prefs = WidgetPreferences(context)

    fun hasLocationPermission(): Boolean = LocationSyncHelper.hasPermission(context)

    suspend fun resolveLocation(): StoredLocation? {
        prefs.getStoredLocation()?.let { return it }

        if (!hasLocationPermission()) return null

        return LocationSyncHelper.fetchDeviceLocation(context)
    }
}
