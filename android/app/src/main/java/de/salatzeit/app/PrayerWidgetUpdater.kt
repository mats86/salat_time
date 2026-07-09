package de.salatzeit.app

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import kotlinx.coroutines.runBlocking

object PrayerWidgetUpdater {
    private val repository = PrayerRepository()

    private data class ScheduleRow(
        val prayerName: String,
        val nameId: Int,
        val timeId: Int,
    )

    private val scheduleRows = listOf(
        ScheduleRow("Fajr", R.id.schedule_fajr_name, R.id.schedule_fajr_time),
        ScheduleRow("Dhuhr", R.id.schedule_dhuhr_name, R.id.schedule_dhuhr_time),
        ScheduleRow("Asr", R.id.schedule_asr_name, R.id.schedule_asr_time),
        ScheduleRow("Maghrib", R.id.schedule_maghrib_name, R.id.schedule_maghrib_time),
        ScheduleRow("Isha", R.id.schedule_isha_name, R.id.schedule_isha_time),
    )

    private val fullScheduleRows = listOf(
        ScheduleRow("Fajr", R.id.full_fajr_name, R.id.full_fajr_time),
        ScheduleRow("Dhuhr", R.id.full_dhuhr_name, R.id.full_dhuhr_time),
        ScheduleRow("Asr", R.id.full_asr_name, R.id.full_asr_time),
        ScheduleRow("Maghrib", R.id.full_maghrib_name, R.id.full_maghrib_time),
        ScheduleRow("Isha", R.id.full_isha_name, R.id.full_isha_time),
    )

    fun updateAll(context: Context, forceRefresh: Boolean = false) {
        val appContext = context.applicationContext
        if (!SalatWidgetRegistry.hasAnyWidgets(appContext)) return

        runBlocking {
            val prefs = WidgetPreferences(appContext)
            val lang = prefs.getLanguage()
            val localizedContext = WidgetLocaleHelper.wrap(appContext, lang)
            val snapshot = loadPrayerSnapshot(appContext, prefs, forceRefresh, localizedContext)

            updatePeaceWidgets(appContext)
            updateMainWidgets(appContext, localizedContext, lang, snapshot)
            updateCountdownWidgets(appContext, localizedContext, snapshot)
            updateScheduleWidgets(appContext, localizedContext, snapshot)
            updateFullWidgets(appContext, localizedContext, snapshot)

            if (snapshot is PrayerSnapshot.Ready) {
                PrayerWidgetScheduler.scheduleAll(appContext, snapshot.nextPrayer.atMillis)
            } else if (hasPeaceWidgets(appContext)) {
                PrayerWidgetScheduler.schedulePeaceScroll(appContext)
            }
        }
    }

    private fun hasPeaceWidgets(context: Context): Boolean {
        return SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.PEACE).isNotEmpty()
    }

    private fun hasPrayerDataWidgets(context: Context): Boolean {
        return SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.MAIN).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.COUNTDOWN).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.SCHEDULE).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.FULL).isNotEmpty()
    }

    fun renderFromCache(context: Context) {
        val appContext = context.applicationContext
        if (!SalatWidgetRegistry.hasAnyWidgets(appContext)) return

        val prefs = WidgetPreferences(appContext)
        val timings = prefs.getCachedTimings()
        if (timings == null) {
            if (hasPrayerDataWidgets(appContext)) {
                updateAll(appContext, forceRefresh = true)
            } else if (hasPeaceWidgets(appContext)) {
                updatePeaceQuranTick(appContext)
            }
            return
        }

        val previousAt = prefs.getCachedNextPrayerAt()
        val lang = prefs.getLanguage()
        val localizedContext = WidgetLocaleHelper.wrap(appContext, lang)
        val snapshot = buildReadySnapshot(prefs, timings, prefs.isOffline())

        updateMainWidgets(appContext, localizedContext, lang, snapshot)
        updateCountdownWidgets(appContext, localizedContext, snapshot)
        updateScheduleWidgets(appContext, localizedContext, snapshot)
        updateFullWidgets(appContext, localizedContext, snapshot)

        val seconds = repository.getCountdownSeconds(snapshot.nextPrayer.atMillis)
        if (seconds > 0) {
            PrayerWidgetScheduler.scheduleNextCountdownTick(appContext)
        }
        if (previousAt != snapshot.nextPrayer.atMillis) {
            PrayerWidgetScheduler.schedulePrayerBoundary(appContext, snapshot.nextPrayer.atMillis)
        }
    }

    private fun buildReadySnapshot(
        prefs: WidgetPreferences,
        timings: PrayerTimings,
        offline: Boolean,
    ): PrayerSnapshot.Ready {
        val next = repository.getNextPrayer(timings)
        syncCachedNextPrayer(prefs, next)
        return PrayerSnapshot.Ready(next, timings, offline)
    }

    private fun syncCachedNextPrayer(prefs: WidgetPreferences, next: NextPrayer) {
        if (prefs.getCachedNextPrayerName() != next.name ||
            prefs.getCachedNextPrayerTime() != next.time ||
            prefs.getCachedNextPrayerAt() != next.atMillis
        ) {
            prefs.saveCachedNextPrayer(next.name, next.time, next.atMillis)
        }
    }

    private suspend fun loadPrayerSnapshot(
        context: Context,
        prefs: WidgetPreferences,
        forceRefresh: Boolean,
        localizedContext: Context,
    ): PrayerSnapshot {
        val needsPrayerData = hasPrayerWidgets(context)
        if (!needsPrayerData) return PrayerSnapshot.LocationNeeded

        val location = resolveLocation(context, prefs) ?: return PrayerSnapshot.LocationNeeded

        val settings = prefs.getCalcSettings()
        val stale = !forceRefresh &&
            System.currentTimeMillis() - prefs.getLastFetch() < WidgetConstants.CACHE_TTL_MS &&
            prefs.getCachedNextPrayerName() != null &&
            prefs.getCachedTimings() != null

        if (stale) {
            val timings = prefs.getCachedTimings()!!
            return buildReadySnapshot(prefs, timings, prefs.isOffline())
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
            PrayerSnapshot.Ready(next, timings, offline = false)
        } catch (_: Exception) {
            val cachedTimings = prefs.getCachedTimings()
            if (cachedTimings != null) {
                buildReadySnapshot(prefs, cachedTimings, offline = true)
            } else {
                PrayerSnapshot.Error(localizedContext.getString(R.string.widget_error))
            }
        }
    }

    private suspend fun resolveLocation(context: Context, prefs: WidgetPreferences): StoredLocation? {
        prefs.getStoredLocation()?.let { return it }

        val locationHelper = PrayerLocationHelper(context)
        if (!locationHelper.hasLocationPermission()) return null
        return locationHelper.resolveLocation()
    }

    private fun hasPrayerWidgets(context: Context): Boolean {
        return SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.MAIN).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.COUNTDOWN).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.SCHEDULE).isNotEmpty() ||
            SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.FULL).isNotEmpty()
    }

    private fun updateMainWidgets(
        context: Context,
        localizedContext: Context,
        lang: String,
        snapshot: PrayerSnapshot,
    ) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.MAIN)
        ids.forEach { id ->
            val views = RemoteViews(context.packageName, SalatWidgetType.MAIN.layoutId)
            attachOpenAppIntent(context, views, SalatWidgetType.MAIN.rootId, id)
            when (snapshot) {
                is PrayerSnapshot.Ready -> renderMainPrayer(
                    views,
                    localizedContext,
                    lang,
                    snapshot.nextPrayer,
                    snapshot.offline,
                )
                is PrayerSnapshot.Error -> renderMainMessage(
                    views,
                    localizedContext,
                    snapshot.message,
                )
                is PrayerSnapshot.LocationNeeded -> renderMainMessage(
                    views,
                    localizedContext,
                    localizedContext.getString(R.string.widget_location_needed),
                )
            }
            manager.updateAppWidget(id, views)
        }
    }

    private fun updateCountdownWidgets(
        context: Context,
        localizedContext: Context,
        snapshot: PrayerSnapshot,
    ) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.COUNTDOWN)
        ids.forEach { id ->
            val views = RemoteViews(context.packageName, SalatWidgetType.COUNTDOWN.layoutId)
            attachOpenAppIntent(context, views, SalatWidgetType.COUNTDOWN.rootId, id)
            when (snapshot) {
                is PrayerSnapshot.Ready -> renderCountdown(
                    views,
                    localizedContext,
                    snapshot.nextPrayer,
                    snapshot.offline,
                )
                is PrayerSnapshot.Error -> renderCountdownMessage(
                    views,
                    localizedContext,
                    snapshot.message,
                )
                is PrayerSnapshot.LocationNeeded -> renderCountdownMessage(
                    views,
                    localizedContext,
                    localizedContext.getString(R.string.widget_location_needed),
                )
            }
            manager.updateAppWidget(id, views)
        }
    }

    private fun updateScheduleWidgets(
        context: Context,
        localizedContext: Context,
        snapshot: PrayerSnapshot,
    ) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.SCHEDULE)

        ids.forEach { id ->
            val views = RemoteViews(context.packageName, SalatWidgetType.SCHEDULE.layoutId)
            attachOpenAppIntent(context, views, SalatWidgetType.SCHEDULE.rootId, id)
            views.setTextViewText(
                R.id.widget_schedule_title,
                localizedContext.getString(R.string.widget_schedule_title),
            )

            when (snapshot) {
                is PrayerSnapshot.Ready -> {
                    views.setViewVisibility(R.id.widget_schedule_error, View.GONE)
                    applyScheduleRows(views, scheduleRows, snapshot, context, localizedContext)
                }
                is PrayerSnapshot.Error -> {
                    views.setViewVisibility(R.id.widget_schedule_error, View.VISIBLE)
                    views.setTextViewText(R.id.widget_schedule_error, snapshot.message)
                }
                is PrayerSnapshot.LocationNeeded -> {
                    views.setViewVisibility(R.id.widget_schedule_error, View.VISIBLE)
                    views.setTextViewText(
                        R.id.widget_schedule_error,
                        localizedContext.getString(R.string.widget_location_needed),
                    )
                }
            }
            manager.updateAppWidget(id, views)
        }
    }

    private fun updateFullWidgets(
        context: Context,
        localizedContext: Context,
        snapshot: PrayerSnapshot,
    ) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = SalatWidgetRegistry.getWidgetIds(context, SalatWidgetType.FULL)

        ids.forEach { id ->
            val views = RemoteViews(context.packageName, SalatWidgetType.FULL.layoutId)
            attachOpenAppIntent(context, views, SalatWidgetType.FULL.rootId, id)
            views.setTextViewText(
                R.id.widget_full_title,
                localizedContext.getString(R.string.widget_schedule_title),
            )

            when (snapshot) {
                is PrayerSnapshot.Ready -> {
                    views.setViewVisibility(R.id.widget_full_error, View.GONE)
                    renderFullCountdown(views, localizedContext, snapshot.nextPrayer, snapshot.offline)
                    applyScheduleRows(views, fullScheduleRows, snapshot, context, localizedContext)
                }
                is PrayerSnapshot.Error -> {
                    renderFullCountdownMessage(views, localizedContext, snapshot.message)
                    views.setViewVisibility(R.id.widget_full_error, View.VISIBLE)
                    views.setTextViewText(R.id.widget_full_error, snapshot.message)
                }
                is PrayerSnapshot.LocationNeeded -> {
                    val message = localizedContext.getString(R.string.widget_location_needed)
                    renderFullCountdownMessage(views, localizedContext, message)
                    views.setViewVisibility(R.id.widget_full_error, View.VISIBLE)
                    views.setTextViewText(R.id.widget_full_error, message)
                }
            }
            manager.updateAppWidget(id, views)
        }
    }

    private fun applyScheduleRows(
        views: RemoteViews,
        rows: List<ScheduleRow>,
        snapshot: PrayerSnapshot.Ready,
        context: Context,
        localizedContext: Context,
    ) {
        val gold = ContextCompat.getColor(context, R.color.widget_gold)
        val muted = ContextCompat.getColor(context, R.color.widget_text_muted)
        rows.forEach { row ->
            val label = WidgetLocaleHelper.getPrayerLabelShort(localizedContext, row.prayerName)
            val time = repository.formatTime12h(snapshot.timings.get(row.prayerName))
            val active = row.prayerName == snapshot.nextPrayer.name
            val color = if (active) gold else muted
            views.setTextViewText(row.nameId, label)
            views.setTextViewText(row.timeId, time)
            views.setTextColor(row.nameId, color)
            views.setTextColor(row.timeId, color)
        }
    }

    fun updatePeaceWidgets(context: Context, widgetIds: IntArray? = null) {
        val appContext = context.applicationContext
        val manager = AppWidgetManager.getInstance(appContext)
        val ids = widgetIds?.takeIf { it.isNotEmpty() }
            ?: SalatWidgetRegistry.getWidgetIds(appContext, SalatWidgetType.PEACE)
        if (ids.isEmpty()) return

        val prefs = WidgetPreferences(appContext)
        val offset = prefs.getQuranScrollOffset()
        val tickerText = AlFatihaContent.tickText(appContext, offset)

        ids.forEach { id ->
            manager.updateAppWidget(id, buildPeaceRemoteViews(appContext, id, tickerText))
        }
        PrayerWidgetScheduler.schedulePeaceScroll(appContext)
    }

    fun updatePeaceQuranTick(context: Context) {
        val appContext = context.applicationContext
        val ids = SalatWidgetRegistry.getWidgetIds(appContext, SalatWidgetType.PEACE)
        if (ids.isEmpty()) {
            PrayerWidgetScheduler.cancelPeaceScroll(appContext)
            return
        }

        val prefs = WidgetPreferences(appContext)
        val periodLength = AlFatihaContent.scrollPeriodLength(appContext)
        val newOffset = AlFatihaContent.nextOffset(prefs.getQuranScrollOffset(), periodLength)
        prefs.saveQuranScrollOffset(newOffset)
        val tickerText = AlFatihaContent.tickText(appContext, newOffset)

        val manager = AppWidgetManager.getInstance(appContext)
        val tickerViews = buildPeaceTickerViews(appContext, tickerText)
        ids.forEach { id ->
            manager.partiallyUpdateAppWidget(id, tickerViews)
        }
        PrayerWidgetScheduler.schedulePeaceScroll(appContext)
    }

    private fun buildPeaceTickerViews(context: Context, tickerText: String): RemoteViews {
        return RemoteViews(context.packageName, SalatWidgetType.PEACE.layoutId).apply {
            setTextViewText(R.id.widget_peace_ayah_ticker, tickerText)
        }
    }

    private fun buildPeaceRemoteViews(
        context: Context,
        widgetId: Int,
        tickerText: String,
    ): RemoteViews {
        val views = RemoteViews(context.packageName, SalatWidgetType.PEACE.layoutId)
        attachOpenAppIntent(context, views, SalatWidgetType.PEACE.rootId, widgetId)
        views.setTextViewText(R.id.widget_peace_surah_title, AlFatihaContent.getSurahTitle(context))
        views.setTextViewText(R.id.widget_peace_ayah_ticker, tickerText)
        return views
    }

    private fun attachOpenAppIntent(
        context: Context,
        views: RemoteViews,
        rootId: Int,
        widgetId: Int,
    ) {
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPending = android.app.PendingIntent.getActivity(
            context,
            widgetId + rootId,
            openAppIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(rootId, openPending)
    }

    private fun renderMainPrayer(
        views: RemoteViews,
        localizedContext: Context,
        lang: String,
        nextPrayer: NextPrayer,
        offline: Boolean,
    ) {
        val prayerLabel = WidgetLocaleHelper.getPrayerLabel(localizedContext, nextPrayer.name)
        val seconds = repository.getCountdownSeconds(nextPrayer.atMillis)
        val countdownText = if (seconds <= 0) {
            localizedContext.getString(R.string.widget_now)
        } else {
            localizedContext.getString(
                R.string.widget_in,
                repository.formatCountdownHuman(seconds, lang),
            )
        }

        views.setTextViewText(R.id.widget_label, localizedContext.getString(R.string.widget_next_prayer))
        views.setTextViewText(R.id.widget_prayer_name, prayerLabel)
        views.setTextViewText(R.id.widget_prayer_time, nextPrayer.time)
        views.setTextViewText(R.id.widget_countdown, countdownText)

        if (offline) {
            views.setViewVisibility(R.id.widget_status, View.VISIBLE)
            views.setTextViewText(R.id.widget_status, localizedContext.getString(R.string.widget_offline))
        } else {
            views.setViewVisibility(R.id.widget_status, View.GONE)
        }
    }

    private fun renderMainMessage(views: RemoteViews, localizedContext: Context, message: String) {
        views.setTextViewText(R.id.widget_label, localizedContext.getString(R.string.widget_next_prayer))
        views.setTextViewText(R.id.widget_prayer_name, message)
        views.setTextViewText(R.id.widget_prayer_time, "--:--")
        views.setTextViewText(R.id.widget_countdown, localizedContext.getString(R.string.widget_loading))
        views.setViewVisibility(R.id.widget_status, View.GONE)
    }

    private fun renderCountdown(
        views: RemoteViews,
        localizedContext: Context,
        nextPrayer: NextPrayer,
        offline: Boolean,
    ) {
        val prayerLabel = WidgetLocaleHelper.getPrayerLabel(localizedContext, nextPrayer.name)
        val seconds = repository.getCountdownSeconds(nextPrayer.atMillis)
        val labelText = if (seconds <= 0) {
            localizedContext.getString(R.string.widget_now)
        } else {
            localizedContext.getString(R.string.widget_prayer_in, prayerLabel)
        }

        views.setTextViewText(R.id.widget_countdown_label, labelText)

        if (seconds <= 0) {
            views.setViewVisibility(R.id.widget_countdown_chronometer, View.GONE)
            views.setViewVisibility(R.id.widget_countdown_timer_static, View.VISIBLE)
            views.setTextViewText(R.id.widget_countdown_timer_static, nextPrayer.time)
        } else {
            views.setViewVisibility(R.id.widget_countdown_chronometer, View.VISIBLE)
            views.setViewVisibility(R.id.widget_countdown_timer_static, View.GONE)
            val base = SystemClock.elapsedRealtime() + seconds * 1000
            views.setChronometerCountDown(R.id.widget_countdown_chronometer, true)
            views.setChronometer(R.id.widget_countdown_chronometer, base, "%s", true)
        }

        if (offline) {
            views.setViewVisibility(R.id.widget_countdown_status, View.VISIBLE)
            views.setTextViewText(
                R.id.widget_countdown_status,
                localizedContext.getString(R.string.widget_offline),
            )
        } else {
            views.setViewVisibility(R.id.widget_countdown_status, View.GONE)
        }
    }

    private fun renderCountdownMessage(
        views: RemoteViews,
        localizedContext: Context,
        message: String,
    ) {
        views.setTextViewText(R.id.widget_countdown_label, message)
        views.setViewVisibility(R.id.widget_countdown_chronometer, View.GONE)
        views.setViewVisibility(R.id.widget_countdown_timer_static, View.VISIBLE)
        views.setTextViewText(R.id.widget_countdown_timer_static, "--:--")
        views.setViewVisibility(R.id.widget_countdown_status, View.GONE)
    }

    private fun renderFullCountdown(
        views: RemoteViews,
        localizedContext: Context,
        nextPrayer: NextPrayer,
        offline: Boolean,
    ) {
        val prayerLabel = WidgetLocaleHelper.getPrayerLabelShort(localizedContext, nextPrayer.name)
        val seconds = repository.getCountdownSeconds(nextPrayer.atMillis)
        val labelText = if (seconds <= 0) {
            localizedContext.getString(R.string.widget_now)
        } else {
            localizedContext.getString(R.string.widget_prayer_in, prayerLabel)
        }

        views.setTextViewText(R.id.widget_full_next_label, labelText)

        if (seconds <= 0) {
            views.setViewVisibility(R.id.widget_full_chronometer, View.GONE)
            views.setViewVisibility(R.id.widget_full_timer_static, View.VISIBLE)
            views.setTextViewText(R.id.widget_full_timer_static, nextPrayer.time)
        } else {
            views.setViewVisibility(R.id.widget_full_chronometer, View.VISIBLE)
            views.setViewVisibility(R.id.widget_full_timer_static, View.GONE)
            val base = SystemClock.elapsedRealtime() + seconds * 1000
            views.setChronometerCountDown(R.id.widget_full_chronometer, true)
            views.setChronometer(R.id.widget_full_chronometer, base, "%s", true)
        }

        if (offline) {
            views.setViewVisibility(R.id.widget_full_offline, View.VISIBLE)
            views.setTextViewText(
                R.id.widget_full_offline,
                localizedContext.getString(R.string.widget_offline),
            )
        } else {
            views.setViewVisibility(R.id.widget_full_offline, View.GONE)
        }
    }

    private fun renderFullCountdownMessage(
        views: RemoteViews,
        localizedContext: Context,
        message: String,
    ) {
        views.setTextViewText(R.id.widget_full_next_label, message)
        views.setViewVisibility(R.id.widget_full_chronometer, View.GONE)
        views.setViewVisibility(R.id.widget_full_timer_static, View.VISIBLE)
        views.setTextViewText(R.id.widget_full_timer_static, "--:--")
        views.setViewVisibility(R.id.widget_full_offline, View.GONE)
    }
}
