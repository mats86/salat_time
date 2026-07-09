package de.salatzeit.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import kotlinx.coroutines.runBlocking
import java.util.Calendar
import java.util.Date

object PrayerNotificationScheduler {
    private val repository = PrayerRepository()

    fun sync(context: Context) {
        val appContext = context.applicationContext
        val prefs = WidgetPreferences(appContext)

        if (!prefs.isNotificationsMasterEnabled() || !prefs.hasAnyPrayerNotifyEnabled()) {
            cancel(appContext)
            return
        }

        runBlocking {
            val next = resolveNextEnabledPrayer(appContext, prefs) ?: run {
                cancel(appContext)
                return@runBlocking
            }
            prefs.saveNotifyTargetPrayer(next.name)
            scheduleExactAlarm(appContext, next.atMillis)
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(buildPendingIntent(context))
    }

    private suspend fun resolveNextEnabledPrayer(
        context: Context,
        prefs: WidgetPreferences,
    ): NextPrayer? {
        val location = resolveLocation(context, prefs) ?: return null
        val settings = prefs.getCalcSettings()
        val enabledPrayers = enabledPrayerSet(prefs)
        if (enabledPrayers.isEmpty()) return null

        val now = Calendar.getInstance()
        val timings = loadTimings(prefs, location, settings, forceRefresh = false)
            ?: return null

        repository.getNextEnabledSchedulePrayer(timings, enabledPrayers, now)?.let { return it }

        val tomorrow = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }
        val tomorrowTimings = try {
            repository.fetchPrayerTimes(location.lat, location.lng, settings, Date(tomorrow.timeInMillis))
        } catch (_: Exception) {
            return null
        }

        for (name in WidgetConstants.SCHEDULE_PRAYERS) {
            if (name !in enabledPrayers) continue
            val time = tomorrowTimings.get(name)
            val at = prayerTimeToMillis(time, tomorrow)
            return NextPrayer(name, time, at)
        }
        return null
    }

    private fun enabledPrayerSet(prefs: WidgetPreferences): Set<String> {
        return WidgetConstants.SCHEDULE_PRAYERS.filter { prefs.isPrayerNotifyEnabled(it) }.toSet()
    }

    private suspend fun loadTimings(
        prefs: WidgetPreferences,
        location: StoredLocation,
        settings: CalcSettings,
        forceRefresh: Boolean,
    ): PrayerTimings? {
        val stale = !forceRefresh &&
            System.currentTimeMillis() - prefs.getLastFetch() < WidgetConstants.CACHE_TTL_MS &&
            prefs.getCachedTimings() != null

        if (stale) {
            return prefs.getCachedTimings()
        }

        return try {
            val timings = repository.fetchPrayerTimes(location.lat, location.lng, settings)
            val next = repository.getNextPrayer(timings)
            prefs.savePrayerState(
                nextName = next.name,
                nextTime = next.time,
                nextAtMillis = next.atMillis,
                timingsJson = timings.toJson().toString(),
                offline = false,
            )
            prefs.saveLocationEverywhere(location.lat, location.lng)
            timings
        } catch (_: Exception) {
            prefs.getCachedTimings()
        }
    }

    private suspend fun resolveLocation(context: Context, prefs: WidgetPreferences): StoredLocation? {
        prefs.getStoredLocation()?.let { return it }

        val locationHelper = PrayerLocationHelper(context)
        if (!locationHelper.hasLocationPermission()) return null
        return locationHelper.resolveLocation()
    }

    private fun prayerTimeToMillis(time: String, base: Calendar, addDay: Boolean = false): Long {
        val parts = time.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
        val cal = (base.clone() as Calendar).apply {
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            if (addDay) add(Calendar.DAY_OF_YEAR, 1)
        }
        return cal.timeInMillis
    }

    private fun scheduleExactAlarm(context: Context, atMillis: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = buildPendingIntent(context)
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            alarmManager.canScheduleExactAlarms()
        if (canExact) {
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    atMillis,
                    pendingIntent,
                )
                return
            } catch (_: SecurityException) {
                // Fall through to inexact alarm.
            }
        }
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pendingIntent)
    }

    private fun buildPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, PrayerAlarmReceiver::class.java).apply {
            action = WidgetConstants.ACTION_PRAYER_NOTIFY
        }
        return PendingIntent.getBroadcast(
            context,
            WidgetConstants.ALARM_PRAYER_NOTIFY,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
