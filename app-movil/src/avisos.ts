import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registrarAparato } from "./servidor";

/**
 * Los avisos de venta nueva, por Firebase.
 *
 * ── Por qué esta app existe, resumido en un párrafo ──
 *
 * La PWA ya recibe avisos, pero por la conexión que mantiene Chrome. En
 * teléfonos con MIUI, HyperOS o EMUI el sistema mata a Chrome en segundo
 * plano y con él se va la conexión: el aviso no llega hasta que alguien
 * abre el navegador. Esta app tiene su propia conexión, registrada a su
 * nombre, y se le pueden dar permisos y exención de batería como app —
 * que es lo que el sistema entiende.
 *
 * ── El canal ──
 *
 * En Android 8 en adelante, un aviso sin canal declarado va al canal por
 * defecto y pierde el sonido y la importancia que se le configuró. El
 * nombre «ventas» tiene que coincidir con el `channel_id` que manda el
 * servidor en `src/lib/avisos-fcm.ts`.
 *
 * ── El token ──
 *
 * Se registra en CADA arranque, no solo la primera vez. Firebase lo rota
 * por su cuenta —al reinstalar, al restaurar el teléfono desde una copia,
 * o cuando le parece— y un token viejo deja de entregar sin avisar.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Con la app abierta también se muestra: si entra una venta mientras
    // se mira otra pantalla, enterarse importa más que no molestar.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararCanal(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("ventas", {
    name: "Ventas nuevas",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: "default",
  });
}

export type ResultadoAvisos =
  | { ok: true; token: string }
  | { ok: false; motivo: string };

/**
 * Pide permiso, saca el token de Firebase y lo registra en el servidor.
 *
 * Devuelve el motivo en vez de lanzar: que los avisos no se puedan
 * activar no es razón para que la app no abra. Se enseña el motivo y se
 * sigue trabajando.
 */
export async function activarAvisos(): Promise<ResultadoAvisos> {
  /*
    No se descarta el emulador por adelantado.

    Lo obvio sería cortar aquí si `Device.isDevice` es falso, pero es
    mentira: un emulador con Google Play sí recibe avisos, y decirle a
    quien está probando que no puede es cerrarle la única forma de
    comprobar que esto funciona antes de instalarlo en el teléfono de
    alguien. Se intenta siempre, y si falla se dice por qué —añadiendo
    que puede ser el emulador solo cuando lo es—.
  */
  await prepararCanal();

  const actual = await Notifications.getPermissionsAsync();
  let concedido = actual.granted;

  if (!concedido && actual.canAskAgain) {
    const pedido = await Notifications.requestPermissionsAsync();
    concedido = pedido.granted;
  }

  if (!concedido) {
    return {
      ok: false,
      motivo:
        "Sin permiso de notificaciones. Actívalo en Ajustes → Aplicaciones → LILUS.",
    };
  }

  let token: string;
  try {
    /*
      El token nativo de Firebase, no el de Expo.

      El servidor manda por FCM directamente con su cuenta de servicio,
      sin pasar por los servidores de Expo. Un intermediario menos que
      pueda estar caído, y nada que dependa de una cuenta ajena.
    */
    const r = await Notifications.getDevicePushTokenAsync();
    token = String(r.data);
  } catch (e) {
    const detalle = (e as Error).message;
    return {
      ok: false,
      motivo: Device.isDevice
        ? `Firebase no está configurado en esta compilación del APK. (${detalle})`
        : `No se pudo sacar el token. Si el emulador no tiene Google Play, ` +
          `es eso. (${detalle})`,
    };
  }

  try {
    const modelo = [Device.brand, Device.modelName].filter(Boolean).join(" ");
    const version = String(
      Constants.expoConfig?.version ?? "0"
    );
    await registrarAparato(token, modelo || "Android", version);
  } catch (e) {
    return { ok: false, motivo: (e as Error).message };
  }

  return { ok: true, token };
}
