import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

/**
 * Microsoft vuelve a la app con viadeep://oauth?code=...; ese código lo lee la pantalla de inicio de sesión que abrió
 * la pestaña. Esta ruta solo existe para que el enlace no muestre "pantalla no encontrada": regresa enseguida.
 */
export default function OAuthRedirect() {
  const canGoBack = router.canGoBack();
  useEffect(() => {
    if (canGoBack) router.back();
  }, [canGoBack]);
  return canGoBack ? null : <Redirect href="/login" />;
}
