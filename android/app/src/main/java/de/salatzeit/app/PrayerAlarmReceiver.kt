package de.salatzeit.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PrayerAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        when (intent?.action) {
            WidgetConstants.ACTION_COUNTDOWN_TICK -> {
                val pendingResult = goAsync()
                PrayerWidgetUpdater.renderFromCache(context)
                pendingResult.finish()
            }
            WidgetConstants.ACTION_QURAN_TICK -> {
                val pendingResult = goAsync()
                PrayerWidgetUpdater.updatePeaceQuranTick(context)
                pendingResult.finish()
            }
            WidgetConstants.ACTION_PRAYER_ALARM, WidgetConstants.ACTION_MIDNIGHT -> {
                PrayerWidgetUpdater.updateAll(context, forceRefresh = true)
                PrayerNotificationScheduler.sync(context)
            }
            WidgetConstants.ACTION_PRAYER_NOTIFY -> {
                val pendingResult = goAsync()
                val prefs = WidgetPreferences(context)
                val prayerName = prefs.getNotifyTargetPrayer()
                if (!prayerName.isNullOrBlank() &&
                    prefs.isNotificationsMasterEnabled() &&
                    prefs.isPrayerNotifyEnabled(prayerName)
                ) {
                    PrayerNotifier.notify(context, prayerName)
                }
                PrayerNotificationScheduler.sync(context)
                pendingResult.finish()
            }
        }
    }
}
