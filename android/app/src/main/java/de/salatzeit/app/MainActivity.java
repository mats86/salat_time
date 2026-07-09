package de.salatzeit.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean hadLocationPermission = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SalatNotificationsPlugin.class);
        super.onCreate(savedInstanceState);
        hadLocationPermission = LocationSyncHelper.INSTANCE.hasPermission(this);
    }

    @Override
    public void onResume() {
        super.onResume();

        boolean hasPermission = LocationSyncHelper.INSTANCE.hasPermission(this);
        LocationSyncHelper.INSTANCE.syncFromDevice(this);
        PrayerNotificationScheduler.INSTANCE.sync(this);

        // After the user grants location for the first time, reload the WebView so
        // navigator.geolocation runs again with permission already granted.
        if (hasPermission && !hadLocationPermission) {
            handler.postDelayed(this::reloadWebViewForGeolocation, 300);
        }

        hadLocationPermission = hasPermission;
    }

    private void reloadWebViewForGeolocation() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        getBridge().getWebView().reload();
    }
}
