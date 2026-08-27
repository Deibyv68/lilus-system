const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Firmar el APK con la llave de LILUS y no con la de debug.
 *
 * ── Por qué un plugin y no editar android/app/build.gradle ──
 *
 * La carpeta `android/` la genera `expo prebuild` y se puede regenerar en
 * cualquier momento —al añadir `google-services.json`, al subir una
 * dependencia nativa—. Cualquier edición a mano ahí desaparece sin
 * ruido, y el APK saldría firmado con la llave de debug sin que nadie se
 * entere hasta que un teléfono se niegue a actualizar la app.
 *
 * Un plugin se vuelve a aplicar en cada prebuild. Es la única forma de
 * que esto no se pierda.
 *
 * ── Por qué importa la llave ──
 *
 * Android identifica una app por su paquete MÁS su firma. Si un APK sale
 * firmado con otra llave, el teléfono no lo trata como una actualización:
 * lo rechaza, y hay que desinstalar la app —perdiendo su sesión y sus
 * permisos— para poder instalar el nuevo.
 *
 * Por eso `android/app/lilus.keystore` no se puede perder. Está en el
 * repositorio a propósito: es un proyecto privado y para una app que se
 * instala a mano, perder la llave duele más de lo que arriesga tenerla
 * ahí. El día que esto vaya a Google Play, esa cuenta se hace cargo de la
 * firma y este comentario deja de aplicar.
 */
module.exports = function conFirmaDeLilus(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (gradle.includes("lilusRelease")) return cfg;

    gradle = gradle.replace(
      /signingConfigs \{\s*\n(\s*)debug \{/,
      `signingConfigs {
$1lilusRelease {
$1    storeFile file('lilus.keystore')
$1    storePassword 'lilus-firma'
$1    keyAlias 'lilus'
$1    keyPassword 'lilus-firma'
$1}
$1debug {`
    );

    // El bloque `release` viene apuntando a la llave de debug.
    gradle = gradle.replace(
      /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.lilusRelease"
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
