package de.salatzeit.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.TimeUnit

object PrayerWidgetScheduler {
    fun scheduleAll(context: Context, nextPrayerAtMillis: Long) {
        schedulePeriodicRefresh(context)
        scheduleNextCountdownTick(context)
        scheduleExactAlarm(
            context,
            WidgetConstants.ALARM_PRAYER,
            WidgetConstants.ACTION_PRAYER_ALARM,
            nextPrayerAtMillis,
        )
        scheduleMidnightRefresh(context)
    }

    fun schedulePeriodicRefresh(context: Context) {
        val request = PeriodicWorkRequestBuilder<PrayerWidgetWorker>(30, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WidgetConstants.WORK_PERIODIC,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    fun scheduleNextCountdownTick(context: Context) {
        val interval = if (needsSecondTick(context)) {
            WidgetConstants.COUNTDOWN_TICK_MS
        } else {
            WidgetConstants.COUNTDOWN_TICK_SLOW_MS
        }
        scheduleCountdownTick(context, System.currentTimeMillis() + interval)
    }

    fun schedulePeaceScroll(context: Context) {
        if (!hasPeaceWidgets(context)) return
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = buildPendingIntent(
            context,
            WidgetConstants.ALARM_QURAN,
            WidgetConstants.ACTION_QURAN_TICK,
        )
        val atMillis = System.currentTimeMillis() + WidgetConstants.PEACE_TICK_MS
        try {
            alarmManager.setExact(AlarmManager.RTC, atMillis, pendingIntent)
        } catch (_: SecurityException) {
            alarmManager.set(AlarmManager.RTC, atMillis, pendingIntent)
        }
    }

    fun scheduleQuranTick(context: Context) {
        schedulePeaceScroll(context)
    }

    fun cancelPeaceScroll(context: Context) {
        cancelQuranTick(context)
    }

    fun scheduleCountdownTick(context: Context, atMillis: Long) {
        scheduleExactAlarm(
            context,
            WidgetConstants.ALARM_COUNTDOWN,
            WidgetConstants.ACTION_COUNTDOWN_TICK,
            atMillis,
        )
    }

    private fun needsSecondTick(context: Context): Boolean {
        return SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.COUNTDOWN).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.FULL).isNotEmpty()
    }

    private fun hasPeaceWidgets(context: Context): Boolean {
        return SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.PEACE).isNotEmpty()
    }

    fun cancelQuranTick(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(
            buildPendingIntent(context, WidgetConstants.ALARM_QURAN, WidgetConstants.ACTION_QURAN_TICK),
        )
    }

    fun scheduleMidnightRefresh(context: Context) {
        val midnight = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 5)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        scheduleExactAlarm(
            context,
            WidgetConstants.ALARM_MIDNIGHT,
            WidgetConstants.ACTION_MIDNIGHT,
            midnight.timeInMillis,
        )
    }

    fun schedulePrayerBoundary(context: Context, atMillis: Long) {
        scheduleExactAlarm(
            context,
            WidgetConstants.ALARM_PRAYER,
            WidgetConstants.ACTION_PRAYER_ALARM,
            atMillis,
        )
    }

    fun cancelAll(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        listOf(
            WidgetConstants.ALARM_COUNTDOWN to WidgetConstants.ACTION_COUNTDOWN_TICK,
            WidgetConstants.ALARM_PRAYER to WidgetConstants.ACTION_PRAYER_ALARM,
            WidgetConstants.ALARM_MIDNIGHT to WidgetConstants.ACTION_MIDNIGHT,
            WidgetConstants.ALARM_QURAN to WidgetConstants.ACTION_QURAN_TICK,
        ).forEach { (requestCode, action) ->
            alarmManager.cancel(buildPendingIntent(context, requestCode, action))
        }
        WorkManager.getInstance(context).cancelUniqueWork(WidgetConstants.WORK_PERIODIC)
    }

    private fun scheduleExactAlarm(
        context: Context,
        requestCode: Int,
        action: String,
        atMillis: Long,
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = buildPendingIntent(context, requestCode, action)
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

    private fun buildPendingIntent(context: Context, requestCode: Int, action: String): PendingIntent {
        val intent = Intent(context, PrayerAlarmReceiver::class.java).apply {
            this.action = action
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
