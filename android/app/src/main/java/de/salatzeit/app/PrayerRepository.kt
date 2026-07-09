package de.salatzeit.app

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

data class PrayerTimings(
    val fajr: String,
    val sunrise: String,
    val dhuhr: String,
    val asr: String,
    val maghrib: String,
    val isha: String,
) {
    fun get(name: String): String = when (name) {
        "Fajr" -> fajr
        "Sunrise" -> sunrise
        "Dhuhr" -> dhuhr
        "Asr" -> asr
        "Maghrib" -> maghrib
        "Isha" -> isha
        else -> fajr
    }

    fun toJson(): JSONObject {
        return JSONObject()
            .put("Fajr", fajr)
            .put("Sunrise", sunrise)
            .put("Dhuhr", dhuhr)
            .put("Asr", asr)
            .put("Maghrib", maghrib)
            .put("Isha", isha)
    }

    companion object {
        fun fromJson(json: JSONObject): PrayerTimings {
            return PrayerTimings(
                fajr = json.optString("Fajr", "00:00"),
                sunrise = json.optString("Sunrise", "00:00"),
                dhuhr = json.optString("Dhuhr", "00:00"),
                asr = json.optString("Asr", "00:00"),
                maghrib = json.optString("Maghrib", "00:00"),
                isha = json.optString("Isha", "00:00"),
            )
        }
    }
}

data class NextPrayer(
    val name: String,
    val time: String,
    val atMillis: Long,
)

class PrayerRepository {
    fun asrSchoolToApi(school: String): Int = if (school == "hanafi") 1 else 0

    fun latitudeAdjustToApi(adjust: String): Int = when (adjust) {
        "one_seventh" -> 2
        "angle_based" -> 3
        else -> 1
    }

    fun fetchPrayerTimes(
        lat: Double,
        lng: Double,
        settings: CalcSettings,
        date: Date = Date(),
    ): PrayerTimings {
        val dateStr = SimpleDateFormat("dd-MM-yyyy", Locale.US).format(date)
        val schoolParam = asrSchoolToApi(settings.school)
        val adjustParam = latitudeAdjustToApi(settings.latitudeAdjust)
        val url = URL(
            "https://api.aladhan.com/v1/timings/$dateStr" +
                "?latitude=$lat&longitude=$lng" +
                "&method=${settings.method}" +
                "&school=$schoolParam" +
                "&latitudeAdjustmentMethod=$adjustParam",
        )

        val connection = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 10_000
            readTimeout = 10_000
            requestMethod = "GET"
        }

        try {
            val code = connection.responseCode
            if (code !in 200..299) {
                throw IllegalStateException("Aladhan HTTP $code")
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)
            val raw = json.getJSONObject("data").getJSONObject("timings")
            return PrayerTimings(
                fajr = stripTime(raw.optString("Fajr")),
                sunrise = stripTime(raw.optString("Sunrise")),
                dhuhr = stripTime(raw.optString("Dhuhr")),
                asr = stripTime(raw.optString("Asr")),
                maghrib = stripTime(raw.optString("Maghrib")),
                isha = stripTime(raw.optString("Isha")),
            )
        } finally {
            connection.disconnect()
        }
    }

    fun getNextPrayer(timings: PrayerTimings, now: Calendar = Calendar.getInstance()): NextPrayer {
        for (name in WidgetConstants.PRAYER_ORDER) {
            val time = timings.get(name)
            val at = prayerTimeToMillis(time, now)
            if (at > now.timeInMillis) {
                return NextPrayer(name, time, at)
            }
        }
        return NextPrayer("Fajr", timings.fajr, prayerTimeToMillis(timings.fajr, now, addDay = true))
    }

    fun getNextEnabledSchedulePrayer(
        timings: PrayerTimings,
        enabledPrayers: Set<String>,
        now: Calendar = Calendar.getInstance(),
    ): NextPrayer? {
        for (name in WidgetConstants.SCHEDULE_PRAYERS) {
            if (name !in enabledPrayers) continue
            val time = timings.get(name)
            val at = prayerTimeToMillis(time, now)
            if (at > now.timeInMillis) {
                return NextPrayer(name, time, at)
            }
        }
        return null
    }

    fun getCountdownSeconds(targetAtMillis: Long, nowMillis: Long = System.currentTimeMillis()): Long {
        val diff = TimeUnit.MILLISECONDS.toSeconds(targetAtMillis - nowMillis)
        return if (diff < 0) 0L else diff
    }

    fun formatCountdown(totalSeconds: Long): String {
        val h = totalSeconds / 3600
        val m = (totalSeconds % 3600) / 60
        val s = totalSeconds % 60
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
    }

    fun formatCountdownShort(totalSeconds: Long): String {
        val h = totalSeconds / 3600
        val m = (totalSeconds % 3600) / 60
        val s = totalSeconds % 60
        return if (h > 0) {
            String.format(Locale.US, "%d:%02d:%02d", h, m, s)
        } else {
            String.format(Locale.US, "%02d:%02d", m, s)
        }
    }

    fun formatTime12h(time24: String): String {
        val parts = time24.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
        val cal = Calendar.getInstance().apply {
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
        }
        return SimpleDateFormat("h:mm a", Locale.US).format(cal.time)
    }

    fun formatCountdownHuman(totalSeconds: Long, lang: String): String {
        val h = totalSeconds / 3600
        val m = (totalSeconds % 3600) / 60
        return when (lang) {
            "ar" -> when {
                h > 0 && m > 0 -> "${h} س ${m} د"
                h > 0 -> "${h} س"
                m > 0 -> "${m} د"
                else -> "أقل من دقيقة"
            }
            "en" -> when {
                h > 0 && m > 0 -> "${h}h ${m}m"
                h > 0 -> "${h}h"
                m > 0 -> "${m}m"
                else -> "< 1 min"
            }
            else -> when {
                h > 0 && m > 0 -> "${h} Std ${m} Min"
                h > 0 -> "${h} Std"
                m > 0 -> "${m} Min"
                else -> "< 1 Min"
            }
        }
    }

    private fun stripTime(value: String): String = value.split(" ").firstOrNull() ?: value

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
}
