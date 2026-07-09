package de.salatzeit.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class PrayerPeaceWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        PrayerWidgetUpdater.updatePeaceWidgets(context, appWidgetIds)
    }

    override fun onEnabled(context: Context) {
        PrayerWidgetUpdater.updatePeaceWidgets(context)
    }

    override fun onDisabled(context: Context) {
        PrayerWidgetScheduler.cancelPeaceScroll(context)
        SalatWidgetRegistry.cancelIfNoWidgets(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == WidgetConstants.ACTION_UPDATE) {
            PrayerWidgetUpdater.updatePeaceWidgets(context)
        }
    }
}
