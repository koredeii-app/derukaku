package com.koredeii.derukaku;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * @capacitor/local-notifications has no API for the system's separate
 * "battery optimization" exemption. Without it, some OEMs (this app was
 * built for a Sharp AQUOS device) defer or drop exact alarms scheduled a
 * few minutes apart even when allowWhileIdle is set, which silently breaks
 * the 2nd/3rd escalation reminder.
 */
@CapacitorPlugin(name = "BatteryOptimization")
public class BatteryOptimizationPlugin extends Plugin {

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ignoring", isIgnoring());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        if (!isIgnoring()) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        JSObject ret = new JSObject();
        ret.put("ignoring", isIgnoring());
        call.resolve(ret);
    }

    private boolean isIgnoring() {
        PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return powerManager != null && powerManager.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }
}
