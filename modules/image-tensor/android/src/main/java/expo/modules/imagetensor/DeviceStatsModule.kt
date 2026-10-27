package expo.modules.imagetensor

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Debug
import android.os.PowerManager
import android.view.WindowManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Lecturas del celular para la prueba de uso continuo: memoria de la app, temperatura de la batería, estado térmico
 * y batería. Ninguna necesita permisos.
 */
class DeviceStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceStats")

    AsyncFunction("snapshot") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val memory = Debug.MemoryInfo().also { Debug.getMemoryInfo(it) }
      val runtime = Runtime.getRuntime()
      val battery = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
      val level = battery?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
      val scale = battery?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
      val temperature = battery?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE) ?: Int.MIN_VALUE
      val plugged = battery?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
      val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      mapOf(
        // PSS: memoria que ocupa la app contando su parte de las librerías compartidas, como la muestra Android.
        "pssMb" to memory.totalPss / 1024.0,
        "javaHeapMb" to (runtime.totalMemory() - runtime.freeMemory()) / 1048576.0,
        "nativeHeapMb" to Debug.getNativeHeapAllocatedSize() / 1048576.0,
        "batteryTempC" to if (temperature == Int.MIN_VALUE) null else temperature / 10.0,
        "batteryPercent" to if (level < 0 || scale <= 0) null else level * 100.0 / scale,
        "charging" to (plugged != 0),
        // 0 = sin estrés térmico ... 6 = apagado; null antes de Android 10.
        "thermalStatus" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) power.currentThermalStatus else null,
        // Fracción del límite térmico (1.0 = el sistema empieza a bajar el rendimiento); null antes de Android 11
        // o si el celular no lo informa.
        "thermalHeadroom" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          power.getThermalHeadroom(0).takeIf { !it.isNaN() }?.toDouble()
        } else {
          null
        }
      )
    }

    // Evita que la pantalla se apague durante la prueba.
    AsyncFunction("setKeepScreenOn") { on: Boolean ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      activity.runOnUiThread {
        if (on) {
          activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
          activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
      }
    }
  }
}
