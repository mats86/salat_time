package de.salatzeit.app

import android.content.Context

object AlFatihaContent {
    private const val RLE = "\u202B"
    private const val PDF = "\u202C"
    private const val SEPARATOR = " ◆ "
    const val TICK_WINDOW_SIZE = 72
    private const val TICK_STEP = 3

    private var cachedLoop: String? = null

    fun getSurahTitle(context: Context): String =
        rtl(context.getString(R.string.quran_fatiha_surah_title))

    fun getLoopText(context: Context): String {
        cachedLoop?.let { return it }
        val ayat = listOf(
            context.getString(R.string.quran_fatiha_1),
            context.getString(R.string.quran_fatiha_2),
            context.getString(R.string.quran_fatiha_3),
            context.getString(R.string.quran_fatiha_4),
            context.getString(R.string.quran_fatiha_5),
            context.getString(R.string.quran_fatiha_6),
            context.getString(R.string.quran_fatiha_7),
        )
        val loop = ayat.joinToString(SEPARATOR) + SEPARATOR
        cachedLoop = loop
        return loop
    }

    fun tickText(context: Context, offset: Int, windowSize: Int = TICK_WINDOW_SIZE): String {
        val loop = getLoopText(context)
        if (loop.isEmpty()) return ""
        val track = loop + loop
        val pos = ((offset % loop.length) + loop.length) % loop.length
        val sb = StringBuilder(windowSize)
        for (i in 0 until windowSize) {
            sb.append(track[(pos + i) % track.length])
        }
        return rtl(sb.toString())
    }

    fun scrollPeriodLength(context: Context): Int = getLoopText(context).length

    private fun rtl(text: String): String =
        if (text.isEmpty()) text else "$RLE$text$PDF"

    fun nextOffset(current: Int, periodLength: Int, step: Int = TICK_STEP): Int {
        if (periodLength <= 0) return 0
        return (current + step) % periodLength
    }
}
