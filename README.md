# ViaDeep-AppMobile

App Android de ViaDeep para que los ciudadanos reporten daños en las pistas de Lima Metropolitana.
Hecha con React Native + Expo (SDK 57) y Expo Router.

## Qué hace hoy

- Registro e inicio de sesión contra `auth-service` (el token JWT se guarda cifrado con `expo-secure-store`).
- Nuevo reporte: foto con la cámara, ubicación GPS, tipo de daño, descripción opcional y envío
  (la foto va a `evidence-service` y el reporte a `incident-service`).
- Lista "Mis reportes" y detalle con la foto, el estado y el historial.

La detección con LMD-YOLO todavía no está integrada: `src/inference/inference-engine.ts` define el punto
donde se conectará el modelo ONNX. Mientras tanto la app usa el flujo manual (el ciudadano elige el tipo
de daño), que es el mismo que se usará cuando la confianza del modelo sea baja.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `src/app/` | Pantallas (Expo Router). `(app)/` agrupa las que requieren sesión. |
| `src/api/` | Clientes HTTP de cada microservicio. |
| `src/session/` | Sesión del usuario y almacenamiento seguro del token. |
| `src/services/` | Lógica del envío de reportes (con pruebas). |
| `src/inference/` | Puerto de inferencia on-device (LMD-YOLO). |
| `src/domain/` | Tipos y etiquetas en español de incidencias. |
| `src/ui/` | Componentes visuales reutilizables. |

## Probar la app en tu celular

Necesitas Node.js 20 o superior y la app **Expo Go** instalada en el celular Android (Play Store).
La PC y el celular deben estar en la **misma red Wi-Fi**.

1. Levanta el backend (repositorio ViaDeep-backend): `docker compose up -d` y luego los servicios
   auth (8081), incidents (8082) y evidences (8083).
   Para que el celular pueda ver las fotos, inicia `evidence-service` con
   `S3_ENDPOINT=http://<IP-de-tu-PC>:9000`.
2. Averigua la IP de tu PC en la red Wi-Fi (en Windows: `ipconfig`, línea "Dirección IPv4").
3. En esta carpeta copia `.env.example` como `.env` y reemplaza `192.168.1.50` por esa IP.
4. Instala las dependencias y arranca:

   ```bash
   npm install
   npx expo start
   ```

5. Escanea el código QR con Expo Go. Si Windows pregunta por el firewall, permite el acceso en redes privadas
   (para Java y para Node).

## Comandos

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Pruebas con Jest
```

Instala dependencias nuevas con `npx expo install <paquete>` para que la versión sea compatible con el SDK.
