import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { PantallaEntrar } from "./src/PantallaEntrar";
import { PantallaPedidos } from "./src/PantallaPedidos";
import { PantallaPanel } from "./src/PantallaPanel";
import { activarAvisos, prepararCanal } from "./src/avisos";
import { salir, sesionActual, type Usuario } from "./src/servidor";
import { C } from "./src/tema";

/**
 * LILUS para Android.
 *
 * Tres pantallas y ninguna base de datos. La app le pregunta todo al
 * servidor de la laptop; lo único que guarda es el token de sesión y la
 * dirección del servidor.
 *
 * ── Por qué no hay librería de navegación ──
 *
 * Son tres pantallas y el camino entre ellas es una línea recta: entrar →
 * pedidos → panel. Meter react-navigation para eso serían cien kilobytes
 * y un concepto más que entender, a cambio de nada.
 */
export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [revisando, setRevisando] = useState(true);
  const [verPanel, setVerPanel] = useState(false);
  const [avisoTokenFcm, setAvisoTokenFcm] = useState<string | null>(null);
  const [avisoProblema, setAvisoProblema] = useState<string | null>(null);
  const [ultimoAviso, setUltimoAviso] = useState<string | null>(null);
  const refrescar = useRef(0);

  /*
    El canal se crea al arrancar, antes de cualquier login.

    Estaba dentro de `activarAvisos`, que solo corre después de entrar. Y
    Android 8 en adelante DESCARTA en silencio cualquier aviso que apunte
    a un canal que no existe: si el servidor mandaba algo antes de que
    alguien hubiera entrado en ese teléfono, se perdía sin dejar rastro.
    Crear el canal no pide permisos ni molesta a nadie, así que no hay
    razón para esperar.
  */
  useEffect(() => {
    prepararCanal().catch(() => {});
  }, []);

  // ¿Sigue viva la sesión de la última vez?
  useEffect(() => {
    sesionActual()
      .then(setUsuario)
      .finally(() => setRevisando(false));
  }, []);

  // Con sesión, se registra el aparato para los avisos.
  useEffect(() => {
    if (!usuario) return;
    activarAvisos().then((r) => {
      if (r.ok) {
        setAvisoTokenFcm(r.token);
        setAvisoProblema(null);
      } else {
        setAvisoProblema(r.motivo);
      }
    });
  }, [usuario]);

  /*
    Tocar un aviso lleva a la lista y la refresca.

    El aviso dice que entró una venta; si al abrir la app se viera la
    lista de hace un rato, sin esa venta, el aviso quedaría como mentira.
  */
  useEffect(() => {
    const tocada = Notifications.addNotificationResponseReceivedListener(() => {
      setVerPanel(false);
      refrescar.current += 1;
    });

    /*
      Deja constancia de que llegó un aviso.

      Es diagnóstico y se queda: cuando alguien dice «no me llegan las
      notificaciones» hay dos preguntas distintas —¿no llegan al teléfono,
      o llegan y no se ven?— y sin esto no se pueden separar. Si aquí
      aparece una hora, el mensaje sí cruzó Firebase y lo que falla es que
      el sistema no lo pinta.

      Solo alcanza a los que llegan con la app viva; los que llegan con
      ella cerrada los pinta Android sin pasar por aquí.
    */
    const recibida = Notifications.addNotificationReceivedListener((n) => {
      const titulo = n.request.content.title ?? "sin título";
      const hora = new Date().toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setUltimoAviso(`${hora} · ${titulo}`);
    });

    return () => {
      tocada.remove();
      recibida.remove();
    };
  }, []);

  const onSalir = useCallback(() => {
    Alert.alert("¿Cerrar sesión?", "Vas a tener que entrar de nuevo.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await salir(avisoTokenFcm);
          setUsuario(null);
          setVerPanel(false);
        },
      },
    ]);
  }, [avisoTokenFcm]);

  if (revisando) {
    return (
      <SafeAreaProvider>
        <View style={estilos.centro}>
          <ActivityIndicator color={C.tenue} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={estilos.raiz} edges={["top", "bottom"]}>
        {!usuario ? (
          <PantallaEntrar onEntro={setUsuario} />
        ) : verPanel ? (
          <PantallaPanel onCerrar={() => setVerPanel(false)} />
        ) : (
          <>
            <View style={estilos.cabecera}>
              <View>
                <Text style={estilos.marca}>LILUS</Text>
                <Text style={estilos.saludo}>
                  {usuario.name.split(" ")[0]}
                </Text>
              </View>
              <Pressable onPress={onSalir} style={estilos.salir}>
                <Text style={estilos.salirTexto}>Salir</Text>
              </Pressable>
            </View>

            {avisoProblema && (
              <View style={estilos.problema}>
                <Text style={estilos.problemaTexto}>{avisoProblema}</Text>
              </View>
            )}

            {ultimoAviso && (
              <View style={estilos.recibido}>
                <Text style={estilos.recibidoTexto}>
                  Último aviso recibido: {ultimoAviso}
                </Text>
              </View>
            )}

            <PantallaPedidos
              key={refrescar.current}
              onAbrirPanel={() => setVerPanel(true)}
            />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.fondo,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.linea,
  },
  marca: { fontSize: 20, fontWeight: "800", color: C.texto, letterSpacing: 0.5 },
  saludo: { fontSize: 12, color: C.tenue, marginTop: 1 },
  salir: { paddingHorizontal: 12, paddingVertical: 10 },
  salirTexto: { color: C.tenue, fontSize: 14 },
  problema: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  problemaTexto: { color: "#92400e", fontSize: 13, lineHeight: 19 },
  recibido: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  recibidoTexto: { color: "#166534", fontSize: 12 },
});
