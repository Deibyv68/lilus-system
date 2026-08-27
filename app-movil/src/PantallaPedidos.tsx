import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  cambiarEstado,
  listarPedidos,
  type Pedido,
} from "./servidor";
import { C, COLOR_ESPERA, colorDeEstado, haceCuanto, money } from "./tema";

/**
 * La lista de pedidos, nativa.
 *
 * ── Por qué esta pantalla es nativa y el resto es web ──
 *
 * Es la única que se abre de pie, en la cocina, con una mano y con prisa
 * — normalmente porque acaba de sonar un aviso. Aquí importa que abra al
 * instante, que se pueda bajar con el dedo para refrescar, y que el botón
 * de «pagado» esté a un toque.
 *
 * El recetario, el inventario o la configuración se usan sentada y con
 * calma: esos se abren en el WebView, con el panel que ya existe. Copiar
 * treinta pantallas más para ganar nada sería trabajo puro.
 *
 * ── El texto del aviso viene del servidor ──
 *
 * El plazo de las 48 horas se cuenta contra el reloj del servidor, no el
 * del teléfono. Un teléfono mal puesto en hora mostraría un plazo
 * distinto al del panel para el mismo pedido.
 *
 * Lo único que se recalcula acá es «hace 3 h», que se refresca solo
 * mientras la pantalla está abierta.
 */
export function PantallaPedidos({ onAbrirPanel }: { onAbrirPanel: () => void }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [cambiando, setCambiando] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresco = false) => {
    if (esRefresco) setRefrescando(true);
    setError(null);
    try {
      setPedidos(await listarPedidos());
      setAhora(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Solo mueve el «hace X»; no pide nada al servidor.
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  function marcarPagado(p: Pedido) {
    Alert.alert(
      "¿Ya llegó la transferencia?",
      `${p.numero} · ${money(p.total)}\n${p.cliente}`,
      [
        { text: "Todavía no", style: "cancel" },
        {
          text: "Sí, marcar pagado",
          onPress: async () => {
            setCambiando(p.id);
            try {
              await cambiarEstado(p.id, "PAID");
              await cargar();
            } catch (e) {
              Alert.alert("No se pudo", (e as Error).message);
            } finally {
              setCambiando(null);
            }
          },
        },
      ]
    );
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={C.tenue} />
      </View>
    );
  }

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(p) => p.id}
      contentContainerStyle={estilos.lista}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={() => cargar(true)} />
      }
      ListHeaderComponent={
        error ? (
          <View style={estilos.error}>
            <Text style={estilos.errorTexto}>{error}</Text>
            <Pressable onPress={() => cargar(true)} style={estilos.reintentar}>
              <Text style={estilos.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        error ? null : (
          <View style={estilos.centro}>
            <Text style={estilos.vacio}>Todavía no hay pedidos.</Text>
          </View>
        )
      }
      ListFooterComponent={
        <Pressable onPress={onAbrirPanel} style={estilos.panelBoton}>
          <Text style={estilos.panelTexto}>Abrir el panel completo</Text>
          <Text style={estilos.panelAyuda}>
            Productos, packs, recetario, inventario, impresión y configuración
          </Text>
        </Pressable>
      }
      renderItem={({ item: p }) => {
        const estado = colorDeEstado(p.estado);
        const espera = p.espera ? COLOR_ESPERA[p.espera.nivel] : null;

        return (
          <View style={estilos.tarjeta}>
            <View style={estilos.fila}>
              <View style={estilos.izquierda}>
                <Text style={estilos.cliente} numberOfLines={1}>
                  {p.cliente}
                </Text>
                <Text style={estilos.numero}>{p.numero}</Text>
              </View>
              <View style={estilos.derecha}>
                <Text style={estilos.total}>{money(p.total)}</Text>
                <Text style={estilos.tiempo}>{haceCuanto(p.creadoEn, ahora)}</Text>
              </View>
            </View>

            <View style={estilos.etiquetas}>
              <View style={[estilos.chip, { backgroundColor: estado.fondo }]}>
                <Text style={[estilos.chipTexto, { color: estado.texto }]}>
                  {p.estadoTexto}
                </Text>
              </View>
              {p.origen === "Web" && (
                <View style={[estilos.chip, { backgroundColor: "#059669" }]}>
                  <Text style={[estilos.chipTexto, { color: "#fff" }]}>Web</Text>
                </View>
              )}
              {p.origen && p.origen !== "Web" && (
                <View style={[estilos.chip, { backgroundColor: C.fondoAlt }]}>
                  <Text style={[estilos.chipTexto, { color: C.tenue }]}>
                    {p.origen}
                  </Text>
                </View>
              )}
              <Text style={estilos.items}>
                {p.items} {p.items === 1 ? "ítem" : "ítems"}
              </Text>
            </View>

            {p.espera && espera && (
              <View
                style={[
                  estilos.aviso,
                  { backgroundColor: espera.fondo, borderColor: espera.borde },
                ]}
              >
                <Text style={[estilos.avisoTitulo, { color: espera.texto }]}>
                  {p.espera.aviso}
                </Text>
                <Text style={[estilos.avisoDetalle, { color: espera.texto }]}>
                  {p.espera.detalle}
                </Text>
              </View>
            )}

            {p.estado === "PENDING" && (
              <Pressable
                onPress={() => marcarPagado(p)}
                disabled={cambiando === p.id}
                style={({ pressed }) => [
                  estilos.pagado,
                  pressed && { opacity: 0.85 },
                  cambiando === p.id && { opacity: 0.5 },
                ]}
              >
                {cambiando === p.id ? (
                  <ActivityIndicator color={C.sobrePrimario} size="small" />
                ) : (
                  <Text style={estilos.pagadoTexto}>Marcar como pagado</Text>
                )}
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  centro: { padding: 40, alignItems: "center", justifyContent: "center" },
  vacio: { color: C.tenue, fontSize: 14 },
  lista: { padding: 14, paddingBottom: 30 },
  tarjeta: {
    borderWidth: 1,
    borderColor: C.linea,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: C.fondo,
  },
  fila: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  izquierda: { flex: 1, minWidth: 0 },
  derecha: { alignItems: "flex-end" },
  cliente: { fontSize: 16, fontWeight: "700", color: C.texto },
  numero: {
    fontSize: 12,
    color: C.tenue,
    marginTop: 2,
    fontFamily: "monospace",
  },
  total: { fontSize: 17, fontWeight: "800", color: C.texto },
  tiempo: { fontSize: 11, color: C.tenue, marginTop: 2 },
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.linea,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipTexto: { fontSize: 11, fontWeight: "600" },
  items: { marginLeft: "auto", fontSize: 11, color: C.tenue },
  aviso: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  avisoTitulo: { fontSize: 13, fontWeight: "600" },
  avisoDetalle: { fontSize: 12, marginTop: 2, opacity: 0.85, lineHeight: 17 },
  pagado: {
    marginTop: 12,
    backgroundColor: C.primario,
    borderRadius: 999,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pagadoTexto: { color: C.sobrePrimario, fontSize: 15, fontWeight: "600" },
  error: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorTexto: { color: "#991b1b", fontSize: 14, lineHeight: 20 },
  reintentar: { marginTop: 10, alignSelf: "flex-start" },
  reintentarTexto: {
    color: "#991b1b",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  panelBoton: {
    borderWidth: 1,
    borderColor: C.linea,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    backgroundColor: C.fondoAlt,
  },
  panelTexto: { fontSize: 15, fontWeight: "600", color: C.texto },
  panelAyuda: { fontSize: 12, color: C.tenue, marginTop: 4, lineHeight: 17 },
});
