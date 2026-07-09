package de.salatzeit.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context

enum class SalatWidgetType(
    val providerClass: Class<out AppWidgetProvider>,
    val layoutId: Int,
    val rootId: Int,
) {
    MAIN(
        PrayerWidgetProvider::class.java,
        R.layout.prayer_widget,
        R.id.widget_root,
    ),
    COUNTDOWN(
        PrayerCountdownWidgetProvider::class.java,
        R.layout.widget_countdown_horizontal,
        R.id.widget_countdown_root,
    ),
    SCHEDULE(
        PrayerScheduleWidgetProvider::class.java,
        R.layout.widget_schedule,
        R.id.widget_schedule_root,
    ),
    PEACE(
        PrayerPeaceWidgetProvider::class.java,
        R.layout.widget_peace,
        R.id.widget_peace_root,
    ),
    FULL(
        PrayerFullWidgetProvider::class.java,
        R.layout.widget_full,
        R.id.widget_full_root,
    ),
}

object SalatWidgetRegistry {
    val allTypes = SalatWidgetType.entries.toList()

    fun getWidgetIds(context: Context, type: SalatWidgetType): IntArray {
        val manager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, type.providerClass)
        return manager.getAppWidgetIds(component)
    }

    fun hasAnyWidgets(context: Context): Boolean {
        return allTypes.any { getWidgetIds(context, it).isNotEmpty() }
    }

    fun cancelIfNoWidgets(context: Context) {
        if (!hasAnyWidgets(context)) {
            PrayerWidgetScheduler.cancelAll(context)
        }
    }
}
