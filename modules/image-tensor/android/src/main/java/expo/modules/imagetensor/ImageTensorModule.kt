package expo.modules.imagetensor

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ColorSpace
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayInputStream
import java.io.File

/**
 * Prepara en código nativo la foto que recibe LMD-YOLO. Reemplaza el camino en JavaScript (redimensionar con
 * ImageManipulator, guardar PNG en base64 y decodificarlo con UPNG), que era más del 80 % de la latencia de un reporte.
 */
class ImageTensorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ImageTensor")

    // Devuelve el tensor [1, 3, 640, 640] como bytes float32 little-endian, la geometría del letterbox y los
    // milisegundos de cada parte, medidos aquí para separar la decodificación del letterbox.
    AsyncFunction("letterbox") { uri: String ->
      val started = SystemClock.elapsedRealtimeNanos()
      val encoded = readBytes(uri)
      val orientation = ExifInterface(ByteArrayInputStream(encoded))
        .getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
      val options = BitmapFactory.Options().apply {
        inScaled = false
        inPreferredConfig = Bitmap.Config.ARGB_8888
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          inPreferredColorSpace = ColorSpace.get(ColorSpace.Named.SRGB)
        }
      }
      val bitmap = BitmapFactory.decodeByteArray(encoded, 0, encoded.size, options)
        ?: throw IllegalArgumentException("Android no pudo leer la foto")
      val width = bitmap.width
      val height = bitmap.height
      val pixels = IntArray(width * height)
      try {
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
      } finally {
        bitmap.recycle()
      }
      val decoded = SystemClock.elapsedRealtimeNanos()
      val result = CanonicalLetterbox.toTensor(pixels, width, height, orientation)
      val finished = SystemClock.elapsedRealtimeNanos()
      val geometry = result.geometry
      mapOf(
        "tensor" to result.tensor,
        "sourceWidth" to geometry.sourceWidth,
        "sourceHeight" to geometry.sourceHeight,
        "resizedWidth" to geometry.resizedWidth,
        "resizedHeight" to geometry.resizedHeight,
        "padLeft" to geometry.padLeft,
        "padTop" to geometry.padTop,
        "decodeMs" to (decoded - started) / 1e6,
        "letterboxMs" to (finished - decoded) / 1e6
      )
    }
  }

  private fun readBytes(uri: String): ByteArray {
    val parsed = Uri.parse(uri)
    if (parsed.scheme == null || parsed.scheme == "file") {
      return File(parsed.path ?: uri).readBytes()
    }
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    return context.contentResolver.openInputStream(parsed)?.use { it.readBytes() }
      ?: throw IllegalArgumentException("No se pudo abrir la foto")
  }
}
