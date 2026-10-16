# ViaDeep-AppMobile

App Android de ViaDeep para que los ciudadanos reporten daños en las pistas de Lima Metropolitana.
Hecha con React Native + Expo (SDK 57) y Expo Router.

## Qué hace hoy

El diseño sigue los mockups de Figma del proyecto (colores, tipografías Inter y JetBrains Mono, íconos Material).

- Login y registro contra `auth-service` (el token JWT se guarda cifrado con `expo-secure-store`).
- Barra inferior con Inicio, Reportar, Mis reportes, Notificaciones y Perfil.
- Reporte en 4 pasos: cámara (con GPS, flash, linterna y galería), vista previa, resultado del análisis y
  confirmación. La foto va a `evidence-service` y el reporte a `incident-service`.
- Mis reportes con filtros por estado, búsqueda y miniatura; detalle con la foto, la caja de detección y
  el estado en 4 fases.
- Notificaciones armadas a partir del historial de cada reporte (el backend aún no tiene servicio de avisos).

La detección corre en el celular con LMD-YOLO (`assets/models/lmd-yolo.onnx`) y ONNX Runtime en CPU:
la foto se encaja en 640 × 640 con el letterbox de Ultralytics (`src/inference/preprocessing.ts`) y de la
salida `[1, 8, 8400]` se toma la caja de mayor confianza (`src/inference/postprocessing.ts`). Si la
confianza es menor que `EXPO_PUBLIC_AI_CONFIDENCE_THRESHOLD` (0.5 por defecto), el ciudadano elige el tipo
de daño. ONNX Runtime es código nativo, así que en Expo Go la app sigue en "MODO MANUAL"; para usar el
modelo se instala el APK de desarrollo (ver más abajo).

El modelo actual es el `best.pt` de la etapa 6 (20 épocas) del repositorio
[ViaDeep/LMD-YOLO](https://github.com/ViaDeep/LMD-YOLO), reparametrizado (DBB en modo deploy) y exportado
a ONNX FP32 640 sin NMS. Para cambiarlo por otro entrenamiento basta con reemplazar el archivo, siempre
que mantenga la entrada `[1, 3, 640, 640]`, la salida `[1, 8, 8400]` y las clases D00, D10, D20 y D40.

Botones del diseño que aún no tienen backend (DNIe, recuperar contraseña, editar perfil, constancia
digital, preferencias de avisos) muestran el aviso "disponible próximamente".

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `src/app/` | Pantallas (Expo Router). `(app)/` agrupa las que requieren sesión y `(app)/(tabs)/` las de la barra inferior. |
| `src/api/` | Clientes HTTP de cada microservicio. |
| `src/session/` | Sesión del usuario y almacenamiento seguro del token. |
| `src/reports/` | Reportes del ciudadano compartidos entre pestañas. |
| `src/report-flow/` | Datos del reporte en curso entre los 4 pasos. |
| `src/notifications/` | Avisos derivados del historial de los reportes (con pruebas). |
| `src/services/` | Envío de reportes y ubicación (con pruebas). |
| `src/inference/` | Inferencia on-device con LMD-YOLO: preproceso, lectura de la salida y motor ONNX Runtime (con pruebas). |
| `src/domain/` | Tipos, etiquetas en español, estados y códigos de reporte (con pruebas). |
| `src/components/` | Tarjetas de reporte y foto con datos superpuestos. |
| `src/ui/` | Componentes visuales base (botones, campos, etiquetas, cabeceras). |

## Probar la app en tu celular

Necesitas Node.js 20 o superior y la app **Expo Go** instalada en el celular Android (Play Store).
La PC y el celular deben estar en la **misma red Wi-Fi**.

   auth (8081), incidents (8082), evidences (8083) y notifications (8084).
   auth (8081), incidents (8082) y evidences (8083).
   Para que el celular pueda ver las fotos, inicia `evidence-service` con
   `S3_ENDPOINT=http://<IP-de-tu-PC>:9000`.
2. Averigua la IP de tu PC en la red Wi-Fi (en Windows: `ipconfig`, línea "Dirección IPv4").
3. En esta carpeta copia `.env.example` como `.env` y reemplaza `192.168.1.50` por esa IP.
4. Instala las dependencias y arranca:

   ```bash
   npm install
   npm start
   ```

   `npm start` abre Expo en el puerto 8090, porque del 8081 al 8084 los usa el backend.

5. Escanea el código QR con Expo Go. Si Windows pregunta por el firewall, permite el acceso en redes privadas
   (para Java y para Node).

## Instalar la app con el modelo (APK)

Expo Go no trae ONNX Runtime, por eso el modelo solo funciona en el APK de ViaDeep. Se arma una vez con
EAS Build (gratis, en la nube) y luego se sigue usando `npm start` como siempre:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Al terminar, EAS muestra un enlace y un QR para descargar el APK en el celular. Con el APK instalado,
arranca `npm start` y abre la app ViaDeep (no Expo Go): se conecta a la PC igual que antes. Solo hay que
volver a armar el APK si se agrega otra librería nativa o se cambia el modelo.

## Comandos

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Pruebas con Jest
```

Instala dependencias nuevas con `npx expo install <paquete>` para que la versión sea compatible con el SDK.
