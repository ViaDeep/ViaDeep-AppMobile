package expo.modules.imagetensor

import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Cómo quedó la foto dentro del cuadrado de 640 px, para devolver luego las cajas a la foto original. */
data class LetterboxGeometry(
  val sourceWidth: Int,
  val sourceHeight: Int,
  val resizedWidth: Int,
  val resizedHeight: Int,
  val padLeft: Int,
  val padTop: Int
)

class CanonicalTensor(val tensor: ByteArray, val geometry: LetterboxGeometry)

/**
 * Letterbox canónico de LMD-YOLO, con las mismas ecuaciones que CanonicalPreprocessor.kt (mobile_benchmark) y
 * scripts/generate_canonical_mobile_golden.py del repositorio LMD-YOLO, descritas en
 * docs/canonical_mobile_preprocessing.md: cuadrado de 640, relleno gris 114, bilineal con centros de píxel, pesos
 * enteros exactos y redondeo half-up, y RGB NCHW float32 / 255.
 *
 * A diferencia de la app de prueba del Galaxy S23, lee directamente los píxeles ARGB del Bitmap (sin copiar a RGB)
 * y aplica la orientación EXIF al leerlos, sin rotar la foto en memoria.
 */
object CanonicalLetterbox {
  const val SIZE = 640
  const val PADDING_VALUE = 114

  /** Dimensiones de la foto ya orientada: las orientaciones EXIF 5 a 8 giran 90° e intercambian ancho y alto. */
  fun orientedSize(width: Int, height: Int, orientation: Int): Pair<Int, Int> =
    if (orientation in 5..8) Pair(height, width) else Pair(width, height)

  /**
   * Arma el tensor [1, 3, 640, 640] (float32 little-endian) de una foto dada como píxeles ARGB_8888 de
   * width × height, tal como están en el archivo, con su orientación EXIF (1 a 8; otro valor = 1).
   */
  fun toTensor(pixels: IntArray, width: Int, height: Int, orientation: Int): CanonicalTensor {
    require(width > 0 && height > 0 && pixels.size == width * height)
    val walk = PixelWalk.of(width, height, orientation)
    val (orientedWidth, orientedHeight) = orientedSize(width, height, orientation)
    val geometry = geometry(orientedWidth, orientedHeight)

    val plane = SIZE * SIZE
    val bytes = ByteArray(3 * plane * 4)
    val tensor = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
    val pad = PADDING_VALUE / 255.0f
    for (i in 0 until 3 * plane) tensor.put(i, pad)

    val xMap = axisMap(orientedWidth, geometry.resizedWidth)
    val yMap = axisMap(orientedHeight, geometry.resizedHeight)
    val denominator = xMap[0].denominator * yMap[0].denominator
    val xLow = IntArray(xMap.size) { xMap[it].low * walk.dx }
    val xHigh = IntArray(xMap.size) { xMap[it].high * walk.dx }
    for (y in 0 until geometry.resizedHeight) {
      val ym = yMap[y]
      val rowLow = walk.base + ym.low * walk.dy
      val rowHigh = walk.base + ym.high * walk.dy
      val targetRow = (y + geometry.padTop) * SIZE + geometry.padLeft
      for (x in 0 until geometry.resizedWidth) {
        val xm = xMap[x]
        val p00 = pixels[rowLow + xLow[x]]
        val p01 = pixels[rowLow + xHigh[x]]
        val p10 = pixels[rowHigh + xLow[x]]
        val p11 = pixels[rowHigh + xHigh[x]]
        val w00 = xm.weightLow * ym.weightLow
        val w01 = xm.weightHigh * ym.weightLow
        val w10 = xm.weightLow * ym.weightHigh
        val w11 = xm.weightHigh * ym.weightHigh
        val target = targetRow + x
        for (channel in 0..2) {
          val shift = 16 - 8 * channel
          val numerator =
            ((p00 ushr shift) and 0xff).toLong() * w00 +
              ((p01 ushr shift) and 0xff).toLong() * w01 +
              ((p10 ushr shift) and 0xff).toLong() * w10 +
              ((p11 ushr shift) and 0xff).toLong() * w11
          val value = ((numerator + denominator / 2L) / denominator).toInt()
          tensor.put(channel * plane + target, value / 255.0f)
        }
      }
    }
    return CanonicalTensor(bytes, geometry)
  }

  fun geometry(sourceWidth: Int, sourceHeight: Int): LetterboxGeometry {
    require(sourceWidth > 0 && sourceHeight > 0)
    val resizedWidth: Int
    val resizedHeight: Int
    if (SIZE.toLong() * sourceWidth <= SIZE.toLong() * sourceHeight) {
      resizedHeight = SIZE
      resizedWidth = roundDivideTiesToEven(sourceWidth.toLong() * SIZE, sourceHeight.toLong())
    } else {
      resizedWidth = SIZE
      resizedHeight = roundDivideTiesToEven(sourceHeight.toLong() * SIZE, sourceWidth.toLong())
    }
    // Con relleno impar, el píxel sobrante va a la derecha o abajo.
    return LetterboxGeometry(
      sourceWidth, sourceHeight, resizedWidth, resizedHeight, (SIZE - resizedWidth) / 2, (SIZE - resizedHeight) / 2
    )
  }

  private fun roundDivideTiesToEven(numerator: Long, denominator: Long): Int {
    val quotient = numerator / denominator
    val remainder = numerator % denominator
    val rounded = when {
      remainder * 2 < denominator -> quotient
      remainder * 2 > denominator -> quotient + 1
      quotient % 2L == 0L -> quotient
      else -> quotient + 1
    }
    return rounded.toInt()
  }

  private class AxisPoint(val low: Int, val high: Int, val weightLow: Long, val weightHigh: Long, val denominator: Long)

  private fun axisMap(sourceLength: Int, targetLength: Int): Array<AxisPoint> {
    val denominator = 2L * targetLength
    return Array(targetLength) { target ->
      val position = (2L * target + 1L) * sourceLength - targetLength
      when {
        position <= 0L -> AxisPoint(0, 0, denominator, 0, denominator)
        position >= (sourceLength - 1L) * denominator -> {
          AxisPoint(sourceLength - 1, sourceLength - 1, denominator, 0, denominator)
        }
        else -> {
          val low = Math.floorDiv(position, denominator).toInt()
          val remainder = position - low.toLong() * denominator
          AxisPoint(low, low + 1, denominator - remainder, remainder, denominator)
        }
      }
    }
  }

  /**
   * Índice en los píxeles del archivo del punto (x, y) de la foto ya orientada: base + x * dx + y * dy.
   * Así se aplica la orientación EXIF sin copiar la foto.
   */
  internal class PixelWalk(val base: Int, val dx: Int, val dy: Int) {
    companion object {
      fun of(width: Int, height: Int, orientation: Int): PixelWalk {
        val right = width - 1
        val bottom = (height - 1) * width
        return when (orientation) {
          2 -> PixelWalk(right, -1, width) // espejo horizontal
          3 -> PixelWalk(right + bottom, -1, -width) // 180°
          4 -> PixelWalk(bottom, 1, -width) // espejo vertical
          5 -> PixelWalk(0, width, 1) // transpuesta
          6 -> PixelWalk(bottom, -width, 1) // 90° horario
          7 -> PixelWalk(right + bottom, -width, -1) // transversa
          8 -> PixelWalk(right, width, -1) // 90° antihorario
          else -> PixelWalk(0, 1, width)
        }
      }
    }
  }
}
