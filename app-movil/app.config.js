const fs = require("fs");
const path = require("path");

/**
 * Configuración de la app.
 *
 * Es un .js y no un app.json por una sola razón: `google-services.json`
 * puede no estar. Ese archivo lo descarga una persona de la consola de
 * Firebase y no se puede generar desde aquí, así que hasta que exista la
 * app tiene que poder compilarse igual — sin avisos push, pero
 * compilable. Con un app.json fijo, Expo aborta el build entero por un
 * archivo que falta.
 *
 * Cuando el archivo aparezca al lado de este, la siguiente compilación lo
 * recoge sola. No hay que acordarse de tocar nada.
 */
const firebase = path.join(__dirname, "google-services.json");
const hayFirebase = fs.existsSync(firebase);

module.exports = {
  expo: {
    name: "LILUS",
    slug: "lilus",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "ec.lilus.sistema",
    },
    android: {
      package: "ec.lilus.sistema",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: ["android.permission.POST_NOTIFICATIONS"],
      ...(hayFirebase ? { googleServicesFile: "./google-services.json" } : {}),
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: [
      "expo-secure-store",
      /*
        `defaultChannel` le dice a Android a qué canal mandar un aviso que
        no traiga uno propio. Sin esto, un mensaje sin `channel_id` cae en
        un canal genérico que la persona nunca configuró —y en MIUI esos
        salen silenciados por defecto—.
      */
      [
        "expo-notifications",
        { color: "#1c1917", defaultChannel: "ventas" },
      ],
      "./plugins/firma",
    ],
  },
};
