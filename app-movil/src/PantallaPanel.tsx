import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { servidor, token } from "./servidor";
import { C } from "./tema";

/**
 * El panel completo, dentro de la app.
 *
 * ── Por qué WebView y no treinta pantallas nativas ──
 *
 * El panel tiene 33 pantallas: recetario, inventario, diccionario,
 * audiovisual, packs, clientes, envíos, configuración, el asistente de
 * pedido nuevo, el centro de impresión. Rehacerlas en nativo sería
 * duplicar meses de trabajo para ganar cero: son pantallas que se usan
 * sentada y con calma, donde nadie nota la diferencia.
 *
 * Lo nativo se reservó para lo que sí la nota: la lista de pedidos y el
 * botón de «pagado», que se usan de pie y con prisa.
 *
 * ── El truco de la entrada ──
 *
 * La primera carga apunta a `/api/movil/abrir` con la cabecera de sesión.
 * Esa ruta planta la cookie y redirige al panel; de ahí en adelante el
 * WebView navega solo, ya con sesión. Sin eso habría que entrar dos
 * veces: una en la app y otra en el panel.
 */
export function PantallaPanel({ onCerrar }: { onCerrar: () => void }) {
  const webview = useRef<WebView>(null);
  const [fuente, setFuente] = useState<{
    uri: string;
    headers: Record<string, string>;
  } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [puedeVolver, setPuedeVolver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [base, t] = await Promise.all([servidor(), token()]);
      if (!t) {
        setError("No hay sesión");
        return;
      }
      setFuente({
        uri: `${base}/api/movil/abrir?ir=/sistema`,
        headers: { authorization: `Bearer ${t}` },
      });
    })();
  }, []);

  return (
    <View style={estilos.raiz}>
      <View style={estilos.barra}>
        {/*
          El botón de atrás navega dentro del panel mientras haya historia,
          y solo cierra cuando ya no la hay. Si cerrara siempre, entrar a
          un producto y querer volver a la lista sacaría de la pantalla.
        */}
        <Pressable
          onPress={() => {
            if (puedeVolver) webview.current?.goBack();
            else onCerrar();
          }}
          style={estilos.botonBarra}
        >
          <Text style={estilos.botonBarraTexto}>
            {puedeVolver ? "‹ Atrás" : "‹ Pedidos"}
          </Text>
        </Pressable>
        <Text style={estilos.titulo}>Panel</Text>
        <Pressable onPress={onCerrar} style={estilos.botonBarra}>
          <Text style={estilos.botonBarraTexto}>Cerrar</Text>
        </Pressable>
      </View>

      {error && (
        <View style={estilos.centro}>
          <Text style={estilos.errorTexto}>{error}</Text>
        </View>
      )}

      {fuente && (
        <WebView
          ref={webview}
          source={fuente}
          style={estilos.web}
          onLoadStart={() => setCargando(true)}
          onLoadEnd={() => setCargando(false)}
          onNavigationStateChange={(n) => setPuedeVolver(n.canGoBack)}
          /*
            Deja «LilusApp» en el user agent.

            El panel lo usa para saber que se está viendo desde aquí. Sin
            eso, la página de avisos decía «este navegador no puede recibir
            avisos» y hablaba de iPhone y de Safari — dentro de una app de
            Android que sí los recibe, solo que por Firebase y no por la
            API de Push, que el WebView no implementa.
          */
          applicationNameForUserAgent="LilusApp/1.0"
          // Los <input type="file"> del panel —subir fotos de producto—
          // no funcionan sin esto en Android.
          allowFileAccess
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          onError={(e) =>
            setError(
              `No se pudo abrir el panel: ${e.nativeEvent.description ?? "error de red"}`
            )
          }
        />
      )}

      {cargando && (
        <View style={estilos.cargando} pointerEvents="none">
          <ActivityIndicator color={C.tenue} />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.linea,
    backgroundColor: C.fondo,
  },
  botonBarra: { paddingHorizontal: 14, paddingVertical: 14, minWidth: 88 },
  botonBarraTexto: { color: C.texto, fontSize: 15 },
  titulo: { fontSize: 15, fontWeight: "700", color: C.texto },
  web: { flex: 1 },
  centro: { padding: 40, alignItems: "center" },
  errorTexto: { color: "#991b1b", fontSize: 14, textAlign: "center" },
  cargando: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
