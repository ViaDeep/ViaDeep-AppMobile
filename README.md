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

La detección con LMD-YOLO todavía no está integrada: `src/inference/engine.ts` es el punto donde se
conectará el modelo ONNX. Mientras tanto la app muestra "MODO MANUAL" y el ciudadano elige el tipo de daño,
que es el mismo flujo que se usa cuando la confianza del modelo es baja.

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
| `src/inference/` | Puerto de inferencia on-device (LMD-YOLO). |
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

## Comandos

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Pruebas con Jest
```

Instala dependencias nuevas con `npx expo install <paquete>` para que la versión sea compatible con el SDK.
