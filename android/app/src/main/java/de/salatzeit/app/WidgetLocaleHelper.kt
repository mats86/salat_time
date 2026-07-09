package de.salatzeit.app

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

object WidgetLocaleHelper {
    fun wrap(context: Context, lang: String): Context {
        val locale = when (lang) {
            "ar" -> Locale.forLanguageTag("ar")
            "en" -> Locale.ENGLISH
            else -> Locale.GERMAN
        }
        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        return context.createConfigurationContext(config)
    }

    fun getPrayerLabel(context: Context, prayerName: String): String {
        val resId = when (prayerName) {
            "Fajr" -> R.string.prayer_fajr
            "Sunrise" -> R.string.prayer_sunrise
            "Dhuhr" -> R.string.prayer_dhuhr
            "Asr" -> R.string.prayer_asr
            "Maghrib" -> R.string.prayer_maghrib
            "Isha" -> R.string.prayer_isha
            else -> R.string.prayer_fajr
        }
        return context.getString(resId)
    }

    fun getPrayerLabelShort(context: Context, prayerName: String): String {
        val resId = when (prayerName) {
            "Fajr" -> R.string.prayer_fajr_short
            "Dhuhr" -> R.string.prayer_dhuhr_short
            "Asr" -> R.string.prayer_asr_short
            "Maghrib" -> R.string.prayer_maghrib_short
            "Isha" -> R.string.prayer_isha_short
            else -> R.string.prayer_fajr_short
        }
        return context.getString(resId)
    }
}
