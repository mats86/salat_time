package de.salatzeit.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class PrayerWidgetWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            PrayerWidgetUpdater.updateAll(applicationContext, forceRefresh = true)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
