package de.salatzeit.app

sealed class PrayerSnapshot {
    data class Ready(
        val nextPrayer: NextPrayer,
        val timings: PrayerTimings,
        val offline: Boolean,
    ) : PrayerSnapshot()

    data class Error(val message: String) : PrayerSnapshot()

    data object LocationNeeded : PrayerSnapshot()
}
