package de.salatzeit.app

object WidgetConstants {
    const val PREFS_WIDGET = "salat_widget_prefs"
    const val PREFS_CAPACITOR = "CapacitorStorage"

    const val KEY_LAT = "widget_lat"
    const val KEY_LNG = "widget_lng"
    const val KEY_NEXT_PRAYER_NAME = "widget_next_prayer_name"
    const val KEY_NEXT_PRAYER_TIME = "widget_next_prayer_time"
    const val KEY_NEXT_PRAYER_AT = "widget_next_prayer_at"
    const val KEY_TIMINGS_JSON = "widget_timings_json"
    const val KEY_LAST_FETCH = "widget_last_fetch"
    const val KEY_OFFLINE = "widget_offline"
    const val KEY_QURAN_SCROLL_OFFSET = "widget_quran_scroll_offset"
    const val KEY_NOTIFY_TARGET_PRAYER = "widget_notify_target_prayer"

    const val CAP_KEY_LANG = "lang"
    const val CAP_KEY_NOTIFY_MASTER = "sz_prayer_alerts_master"
    const val CAP_KEY_NOTIFY_PREFIX = "sz_prayer_alerts_"
    const val CAP_KEY_METHOD = "sz_calc_method"
    const val CAP_KEY_SCHOOL = "sz_calc_school"
    const val CAP_KEY_LAT_ADJUST = "sz_calc_latitude_adjust"
    const val CAP_KEY_LOCATION = "salat_location_v2"

    const val ACTION_UPDATE = "de.salatzeit.app.action.WIDGET_UPDATE"
    const val ACTION_COUNTDOWN_TICK = "de.salatzeit.app.action.COUNTDOWN_TICK"
    const val ACTION_PRAYER_ALARM = "de.salatzeit.app.action.PRAYER_ALARM"
    const val ACTION_MIDNIGHT = "de.salatzeit.app.action.MIDNIGHT"
    const val ACTION_QURAN_TICK = "de.salatzeit.app.action.QURAN_TICK"
    const val ACTION_PRAYER_NOTIFY = "de.salatzeit.app.action.PRAYER_NOTIFY"

    const val WORK_PERIODIC = "salat_widget_periodic"
    const val ALARM_COUNTDOWN = 1001
    const val ALARM_PRAYER = 1002
    const val ALARM_MIDNIGHT = 1003
    const val ALARM_QURAN = 1004
    const val ALARM_PRAYER_NOTIFY = 1005

    const val NOTIFY_CHANNEL_ID = "salat_prayer_times"
    const val NOTIFY_ID_BASE = 3000

    val PRAYER_ORDER = listOf("Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha")
    val SCHEDULE_PRAYERS = listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")

    const val DEFAULT_METHOD = 3
    const val DEFAULT_SCHOOL = "standard"
    const val DEFAULT_LAT_ADJUST = "middle_of_night"
    const val DEFAULT_LANG = "de"

    const val CACHE_TTL_MS = 30 * 60 * 1000L
    const val COUNTDOWN_TICK_MS = 1_000L
    const val COUNTDOWN_TICK_SLOW_MS = 60_000L
    const val PEACE_TICK_MS = 200L
    const val QURAN_TICK_MS = 300L
}
