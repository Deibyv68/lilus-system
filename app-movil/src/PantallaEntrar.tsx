import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  entrar,
  guardarServidor,
  servidor,
  type Usuario,
} from "./servidor";
import { C } from "./tema";

/**
 * Entrar.
 *
 * Los mismos usuario y contraseña del panel web: no hay cuentas de app.
 * La dirección del servidor se puede cambiar desde aquí porque va a
 * cambiar —hoy Tailscale, mañana el dominio— y si estuviera quemada en el
 * código habría que recompilar el APK ese día.
 */
export function PantallaEntrar({
  onEntro,
}: {
  onEntro: (u: Usuario) => void;
}) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [url, setUrl] = useState("");
  const [verServidor, setVerServidor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    servidor().then(setUrl);
  }, []);

  async function onEntrar() {
    setError(null);
    setEntrando(true);
    try {
      if (url.trim()) await guardarServidor(url);
      const u = await entrar(usuario.trim(), clave);
      onEntro(u);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEntrando(false);
    }
  }

  const puede = usuario.trim().length > 0 && clave.length > 0 && !entrando;

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.centro}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={estilos.marca}>LILUS</Text>
        <Text style={estilos.lema}>Gestión de ventas</Text>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Usuario</Text>
          <TextInput
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
            style={estilos.input}
            placeholder="admin"
            placeholderTextColor="#a8a29e"
          />
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Contraseña</Text>
          <TextInput
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            style={estilos.input}
            onSubmitEditing={() => puede && onEntrar()}
            returnKeyType="go"
          />
        </View>

        {error && (
          <View style={estilos.error}>
            <Text style={estilos.errorTexto}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={onEntrar}
          disabled={!puede}
          style={({ pressed }) => [
            estilos.boton,
            !puede && estilos.botonApagado,
            pressed && estilos.botonPresionado,
          ]}
        >
          {entrando ? (
            <ActivityIndicator color={C.sobrePrimario} />
          ) : (
            <Text style={estilos.botonTexto}>Entrar</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setVerServidor((v) => !v)}
          style={estilos.enlace}
        >
          <Text style={estilos.enlaceTexto}>
            {verServidor ? "Ocultar" : "Cambiar servidor"}
          </Text>
        </Pressable>

        {verServidor && (
          <View style={estilos.campo}>
            <Text style={estilos.etiqueta}>Dirección del servidor</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={estilos.input}
            />
            <Text style={estilos.ayuda}>
              Con https:// al principio. Cámbialo el día que compres el
              dominio.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  centro: { flexGrow: 1, justifyContent: "center", padding: 28 },
  marca: {
    fontSize: 40,
    fontWeight: "800",
    color: C.texto,
    letterSpacing: 1,
    textAlign: "center",
  },
  lema: {
    fontSize: 14,
    color: C.tenue,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 36,
  },
  campo: { marginBottom: 18 },
  etiqueta: {
    fontSize: 12,
    color: C.tenue,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.linea,
    borderRadius: 12,
    paddingHorizontal: 14,
    // 52 de alto: es el mínimo cómodo para un dedo, y de paso el texto a
    // 16 evita que el teclado del sistema haga zoom al enfocar.
    height: 52,
    fontSize: 16,
    color: C.texto,
    backgroundColor: C.fondo,
  },
  ayuda: { fontSize: 12, color: C.tenue, marginTop: 6 },
  error: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorTexto: { color: "#991b1b", fontSize: 14, lineHeight: 20 },
  boton: {
    backgroundColor: C.primario,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  botonApagado: { opacity: 0.4 },
  botonPresionado: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  botonTexto: { color: C.sobrePrimario, fontSize: 16, fontWeight: "600" },
  enlace: { alignSelf: "center", padding: 14, marginTop: 8 },
  enlaceTexto: { color: C.tenue, fontSize: 13, textDecorationLine: "underline" },
});
