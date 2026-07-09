package de.salatzeit.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class PrayerCountdownWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        PrayerWidgetUpdater.updateAll(context, forceRefresh = false)
    }

    override fun onEnabled(context: Context) {
        PrayerWidgetScheduler.schedulePeriodicRefresh(context)
        PrayerWidgetUpdater.updateAll(context, forceRefresh = true)
    }

    override fun onDisabled(context: Context) {
        SalatWidgetRegistry.cancelIfNoWidgets(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == WidgetConstants.ACTION_UPDATE) {
            PrayerWidgetUpdater.updateAll(context, forceRefresh = true)
        }
    }
}
