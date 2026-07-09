package de.salatzeit.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

data class CalcSettings(
    val method: Int,
    val school: String,
    val latitudeAdjust: String,
)

data class StoredLocation(
    val lat: Double,
    val lng: Double,
)

class WidgetPreferences(context: Context) {
    private val appContext = context.applicationContext
    private val widgetPrefs: SharedPreferences =
        appContext.getSharedPreferences(WidgetConstants.PREFS_WIDGET, Context.MODE_PRIVATE)
    private val capacitorPrefs: SharedPreferences =
        appContext.getSharedPreferences(WidgetConstants.PREFS_CAPACITOR, Context.MODE_PRIVATE)

    fun getLanguage(): String {
        return capacitorPrefs.getString(WidgetConstants.CAP_KEY_LANG, null)
            ?: WidgetConstants.DEFAULT_LANG
    }

    fun getCalcSettings(): CalcSettings {
        val method = capacitorPrefs.getString(WidgetConstants.CAP_KEY_METHOD, null)?.toIntOrNull()
            ?: WidgetConstants.DEFAULT_METHOD
        val school = capacitorPrefs.getString(WidgetConstants.CAP_KEY_SCHOOL, null)
            ?: WidgetConstants.DEFAULT_SCHOOL
        val latitudeAdjust = capacitorPrefs.getString(WidgetConstants.CAP_KEY_LAT_ADJUST, null)
            ?: WidgetConstants.DEFAULT_LAT_ADJUST
        return CalcSettings(method, school, latitudeAdjust)
    }

    fun getStoredLocation(): StoredLocation? {
        val raw = capacitorPrefs.getString(WidgetConstants.CAP_KEY_LOCATION, null)
        if (!raw.isNullOrBlank()) {
            parseLocationJson(raw)?.let { return it }
        }

        val lat = widgetPrefs.getFloat(WidgetConstants.KEY_LAT, Float.NaN)
        val lng = widgetPrefs.getFloat(WidgetConstants.KEY_LNG, Float.NaN)
        if (!lat.isNaN() && !lng.isNaN()) {
            return StoredLocation(lat.toDouble(), lng.toDouble())
        }
        return null
    }

    fun saveLocation(lat: Double, lng: Double) {
        widgetPrefs.edit()
            .putFloat(WidgetConstants.KEY_LAT, lat.toFloat())
            .putFloat(WidgetConstants.KEY_LNG, lng.toFloat())
            .apply()
    }

    fun saveLocationEverywhere(lat: Double, lng: Double) {
        saveLocation(lat, lng)
        val payload = JSONObject()
            .put("lat", lat)
            .put("lng", lng)
            .toString()
        capacitorPrefs.edit()
            .putString(WidgetConstants.CAP_KEY_LOCATION, payload)
            .apply()
    }

    fun savePrayerState(
        nextName: String,
        nextTime: String,
        nextAtMillis: Long,
        timingsJson: String,
        offline: Boolean,
    ) {
        widgetPrefs.edit()
            .putString(WidgetConstants.KEY_NEXT_PRAYER_NAME, nextName)
            .putString(WidgetConstants.KEY_NEXT_PRAYER_TIME, nextTime)
            .putLong(WidgetConstants.KEY_NEXT_PRAYER_AT, nextAtMillis)
            .putString(WidgetConstants.KEY_TIMINGS_JSON, timingsJson)
            .putLong(WidgetConstants.KEY_LAST_FETCH, System.currentTimeMillis())
            .putBoolean(WidgetConstants.KEY_OFFLINE, offline)
            .apply()
    }

    fun getCachedNextPrayerName(): String? =
        widgetPrefs.getString(WidgetConstants.KEY_NEXT_PRAYER_NAME, null)

    fun getCachedNextPrayerTime(): String? =
        widgetPrefs.getString(WidgetConstants.KEY_NEXT_PRAYER_TIME, null)

    fun getCachedNextPrayerAt(): Long =
        widgetPrefs.getLong(WidgetConstants.KEY_NEXT_PRAYER_AT, 0L)

    fun isOffline(): Boolean =
        widgetPrefs.getBoolean(WidgetConstants.KEY_OFFLINE, false)

    fun getLastFetch(): Long =
        widgetPrefs.getLong(WidgetConstants.KEY_LAST_FETCH, 0L)

    fun saveCachedNextPrayer(nextName: String, nextTime: String, nextAtMillis: Long) {
        widgetPrefs.edit()
            .putString(WidgetConstants.KEY_NEXT_PRAYER_NAME, nextName)
            .putString(WidgetConstants.KEY_NEXT_PRAYER_TIME, nextTime)
            .putLong(WidgetConstants.KEY_NEXT_PRAYER_AT, nextAtMillis)
            .apply()
    }

    fun getCachedTimings(): PrayerTimings? {
        val raw = widgetPrefs.getString(WidgetConstants.KEY_TIMINGS_JSON, null) ?: return null
        return try {
            PrayerTimings.fromJson(JSONObject(raw))
        } catch (_: Exception) {
            null
        }
    }

    fun getQuranScrollOffset(): Int =
        widgetPrefs.getInt(WidgetConstants.KEY_QURAN_SCROLL_OFFSET, 0)

    fun saveQuranScrollOffset(offset: Int) {
        widgetPrefs.edit()
            .putInt(WidgetConstants.KEY_QURAN_SCROLL_OFFSET, offset)
            .apply()
    }

    fun isNotificationsMasterEnabled(): Boolean =
        capacitorPrefs.getString(WidgetConstants.CAP_KEY_NOTIFY_MASTER, null) == "true"

    fun isPrayerNotifyEnabled(prayerName: String): Boolean {
        val key = "${WidgetConstants.CAP_KEY_NOTIFY_PREFIX}$prayerName"
        val stored = capacitorPrefs.getString(key, null)
        return stored != "false"
    }

    fun hasAnyPrayerNotifyEnabled(): Boolean {
        return WidgetConstants.SCHEDULE_PRAYERS.any { isPrayerNotifyEnabled(it) }
    }

    fun saveNotifyTargetPrayer(prayerName: String) {
        widgetPrefs.edit()
            .putString(WidgetConstants.KEY_NOTIFY_TARGET_PRAYER, prayerName)
            .apply()
    }

    fun getNotifyTargetPrayer(): String? =
        widgetPrefs.getString(WidgetConstants.KEY_NOTIFY_TARGET_PRAYER, null)

    private fun parseLocationJson(raw: String): StoredLocation? {
        return try {
            val json = JSONObject(raw)
            val lat = json.optDouble("lat", Double.NaN)
            val lng = json.optDouble("lng", Double.NaN)
            if (lat.isNaN() || lng.isNaN()) null else StoredLocation(lat, lng)
        } catch (_: Exception) {
            null
        }
    }
}
