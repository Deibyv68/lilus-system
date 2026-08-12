# -*- coding: utf-8 -*-
"""
El texto de la guía de teléfono. La maquetación vive en
generar-guia-telefono.py; acá solo está qué se dice y en qué orden.

Se ejecuta así:
    python guia-telefono-contenido.py guia-lilus-telefono.pdf
"""
import importlib.util
import io
import os
import sys

from reportlab.pdfgen import canvas
from reportlab.lib import colors

_aqui = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "maqueta", os.path.join(_aqui, "generar-guia-telefono.py"))
maqueta = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(maqueta)

Doc, diagrama = maqueta.Doc, maqueta.diagrama
W, H, M, CW = maqueta.W, maqueta.H, maqueta.M, maqueta.CW
mm = maqueta.mm
TINTA, GRIS, ACENTO, GRIS_CLARO = maqueta.TINTA, maqueta.GRIS, maqueta.ACENTO, maqueta.GRIS_CLARO


# ═════════════════════════════════════════════════════════════
# Portada e índice
# ═════════════════════════════════════════════════════════════

def portada(d):
    c = d.c
    c.setFillColor(TINTA)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(M, H - 46 * mm, "LILUS")
    c.setFillColor(colors.HexColor("#c8a882"))
    c.setFont("Helvetica-Oblique", 10.5)
    c.drawString(M, H - 53 * mm, "Ilumina tu belleza")

    c.setStrokeColor(ACENTO)
    c.setLineWidth(2.5)
    c.line(M, H - 61 * mm, M + 24 * mm, H - 61 * mm)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(M, H - 77 * mm, "Guia de rodaje")
    c.setFillColor(colors.HexColor("#a0a0a0"))
    c.setFont("Helvetica", 11)
    c.drawString(M, H - 85 * mm, "Dos dias, plano a plano")

    c.setFillColor(colors.HexColor("#8a8a8a"))
    c.setFont("Helvetica", 8.6)
    for i, ln in enumerate([
        "La hoja A4 sirve pegada en la pared.",
        "Esto es lo otro: el detalle, para leer",
        "con el pulgar mientras ruedas.",
    ]):
        c.drawString(M, H - 106 * mm - i * 5.2 * mm, ln)

    c.setStrokeColor(colors.HexColor("#3a3a3a"))
    c.setLineWidth(0.8)
    c.line(M, 24 * mm, W - M, 24 * mm)
    c.setFillColor(colors.HexColor("#6a6a6a"))
    c.setFont("Helvetica", 7.4)
    c.drawString(M, 18 * mm, "Sin cara  ·  la voz va aparte, con Focusrite")
    c.drawString(M, 14 * mm, "Los dos dias se ruedan MUDOS")
    c.drawString(M, 10 * mm, "El Maono solo hace foley y ambiente")

    c.showPage()
    d.pag += 1
    d.y = H - M


def indice(d, mapa):
    d.seccion = "Indice"
    c = d.c
    c.setFillColor(TINTA)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(M, d.y - 8 * mm, "Indice")
    c.setStrokeColor(ACENTO)
    c.setLineWidth(2)
    c.line(M, d.y - 12 * mm, M + 18 * mm, d.y - 12 * mm)
    d.y -= 24 * mm

    for i, (titulo, pag) in enumerate(mapa.items(), 1):
        c.setFillColor(ACENTO)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(M, d.y, str(i))
        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(M + 6 * mm, d.y, titulo)
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 10)
        c.drawRightString(W - M, d.y, str(pag))
        c.setStrokeColor(GRIS_CLARO)
        c.setLineWidth(0.5)
        c.line(M, d.y - 2.6 * mm, W - M, d.y - 2.6 * mm)
        d.y -= 9 * mm

    d.y -= 6 * mm
    d.caja("Las fichas de plano llevan puntos verdes a la derecha. Mas puntos, "
           "menos negociable: si el dia se atrasa, esos son los que igual hay "
           "que sacar.", "Como leer esto")

    d.pie()
    c.showPage()
    d.pag += 1
    d.y = H - M


# ═════════════════════════════════════════════════════════════
# 1 · Qué se fabrica
# ═════════════════════════════════════════════════════════════

def sec_fabrica(d):
    d.portadilla("1", "Que se fabrica",
                 "Todo el dia 1. El dia 2 no se hace jabon: se corta el de ayer.")

    d.clave("3 tandas de jabon (2.4 kg de base) y 2 jarras de crema (400 g).",
            "El resumen")

    d.h2("Jabon: 3 tandas")
    d.tabla([
        ("Tanda 1", "Barra de 4 CAPAS de colores. 1200 g (4 x 300 g). Molde tipo pan. Salen ~10 rebanadas."),
        ("Tanda 2", "Barra con EMBED dentro. 600 g. Salen ~5 rebanadas."),
        ("Tanda 3", "Barra SIMPLE con exfoliante. 600 g. Es la de practica de corte."),
    ], ancho_izq=20 * mm)

    d.h3("La tanda 1 es la importante")
    d.parrafo("De esa sola barra salen ocho videos:")
    d.vinetas([
        "La elaboracion capa por capa (dia 1)",
        "La barra girando, que abre y cierra ese mismo video (dia 2)",
        "El corte, que ademas revela las capas",
        "Las causticas",
        "El corte multiple, 5 rebanadas seguidas",
        "El desmolde en camara lenta",
        "La espuma, con las sobras del corte",
        "El jabon que suda: una rebanada se deja sin envolver la noche del medio",
    ])

    d.alerta("El EMBED tiene que existir ANTES del dia 1. Si es un jabon chico, "
             "hazlo dias antes y que este bien duro: si lo haces el mismo dia se "
             "derrite al verter la base caliente encima. Alternativas que no hay "
             "que fabricar: una flor seca, una rodaja de naranja seca.")

    d.h2("Te falta un molde, y no hay que comprarlo")
    d.parrafo("Para los videos de corte necesitas un molde tipo PAN, largo y "
              "rectangular. Los moldes individuales que tienes dan una barra "
              "sola, no un bloque del que sacar rebanadas.")
    d.tabla([
        ("Tetrapak", "De leche de 1 L, cortado a lo largo. Es el molde casero clasico de la jaboneria. Cuesta cero y desmolda perfecto."),
        ("Tupper", "Rectangular, forrado con papel de horno."),
        ("Silicona", "Un molde de budin de la cocina."),
    ], ancho_izq=20 * mm)

    d.h2("Crema: 2 jarras chicas")
    d.tabla([
        ("Jarra A", "A 95 grados. Se corta. SE BOTA: es el punto del video."),
        ("Jarra B", "A 72 grados. Sale bien. De aqui sale toda la crema de los planos."),
    ], ancho_izq=20 * mm)
    d.parrafo("Son 400 g en total, poco a proposito: una se pierde entera.")

    d.h3("De la jarra B salen tres muestras")
    d.parrafo("Para la serie del olor a huevo hacen falta tres cremas distintas. "
              "No son tres elaboraciones: son tres cucharadas de la jarra B en "
              "tres recipientes chicos.")
    d.casillas([
        "Muestra 1: crema base sola, sin nada",
        "Muestra 2: crema base + colageno",
        "Muestra 3: crema base + elastina",
    ])
    d.alerta("Etiquetalas. En camara se ven identicas y es facilisimo "
             "confundirlas a mitad de rodaje.", "No te saltes esto")

    d.h2("Lo que no se fabrica pero hace falta")
    d.tabla([
        ("Un jabon tuyo", "Para lavarse las manos con el cronometro"),
        ("Barra industrial", "Para comparar con el jabon que suda. Quitale el envoltorio; si tiene logo en relieve, ruedala desde otro angulo"),
        ("Frasco ambar", "Para el plano estrella del olor a huevo"),
        ("Frasco plastico", "El mismo plano"),
        ("Cronometro", "Numeros grandes y legibles"),
        ("Tiras de pH", "Medicion real, no trucada"),
    ], ancho_izq=27 * mm)

    d.h2("Por que son dos dias y no uno")
    d.parrafo("La glicerina cuaja al tacto en una o dos horas, pero para cortarla "
              "limpia —sin que se deforme ni se pegue al cuchillo— conviene que "
              "pase la noche.")
    d.parrafo("Esa espera no se puede acelerar. Asi que en vez de pelearla, la "
              "usamos como la division entre los dos dias.")


# ═════════════════════════════════════════════════════════════
# 2 · Tu set
# ═════════════════════════════════════════════════════════════

def sec_set(d):
    d.portadilla("2", "Tu set",
                 "Escrito sobre la foto de tu taller, no en abstracto.")

    d.h2("Lo bueno")
    d.vinetas([
        "El azulejo de piso como mesa fue muy buena idea: se limpia, no absorbe, "
        "y el veteado da textura sin robar atencion.",
        "Las luces tienen viseras. Eso vale mas que la potencia: te dejan decidir "
        "donde NO cae la luz, que es la mitad del trabajo.",
        "La estanteria de frascos del fondo es oro. Desenfocada detras de un "
        "plano de manos, es la prueba de que esto es un taller de verdad y no un "
        "set montado.",
    ])

    d.h2("Los tres problemas")

    d.h3("1 · La mesa esta contra la pared")
    d.parrafo("Es el problema grande. Los montajes que hacen bonito al jabon "
              "transparente necesitan una luz DETRAS del jabon, y detras no hay "
              "sitio.")
    d.clave("Separa la mesa de la pared 70-80 cm. Con eso metes un tripode de luz "
            "por detras y se te abren los dos montajes que hoy no puedes hacer.",
            "La solucion")
    d.parrafo("Si de plano no se puede mover: la luz de fondo no tiene que estar "
              "en un tripode. Apoyada sobre la propia mesa, 30 cm detras del "
              "jabon y apuntando hacia la camara, funciona igual. Se tapa con una "
              "cartulina negra para que no entre en cuadro.")

    d.h3("2 · La ventana a la cocina")
    d.parrafo("Es un agujero en el fondo. En cualquier plano abierto se ve la "
              "cocina, y si entra luz de dia tiene otro color que tus LED: te va "
              "a pelear el balance de blancos toda la edicion.")
    d.parrafo("Graba de noche. Es lo mas simple y te da control total. Para este "
              "tipo de contenido, la noche es tu amiga.")

    d.h3("3 · Las luces no son tan fuertes")
    d.parrafo("Aqui casi no hay problema. La luz cae con el CUADRADO de la "
              "distancia:")
    d.tabla([
        ("a 2 m", "x1"),
        ("a 1 m", "x4"),
        ("a 50 cm", "x16"),
    ], ancho_izq=22 * mm)
    d.parrafo("Estas grabando objetos chiquitos. Acerca las luces a 40-60 cm y de "
              "golpe tienes mas luz de la que necesitas. Las viseras sirven justo "
              "para eso: acercar sin que se desborde por todos lados.")
    d.clave("La BMPCC 6K tiene DOS ISO nativos: 400 y 3200. No es una escala "
            "continua: ISO 3200 es mas limpio que ISO 1600. Si en macro a f/8 te "
            "falta luz, salta directo a 3200 sin culpa.",
            "Lo que casi nadie usa")
    d.parrafo("Orden para resolver falta de luz: acercar la luz, abrir el "
              "diafragma si la profundidad lo permite, saltar a ISO 3200. Recien "
              "ahi, preocuparse.")

    d.h2("Las cartulinas hacen tres papeles")
    d.tabla([
        ("Fondo", "NEGRA, parada detras. Convierte la pared verde y la ventana en un vacio negro."),
        ("Superficie", "NEGRA, acostada sobre el azulejo. SOLO para producto y corte."),
        ("Negativo", "NEGRA, de canto al lado, a 20 cm. No ilumina: QUITA luz, y crea el borde oscuro que da volumen."),
        ("Rebote", "BLANCA, al lado. Devuelve luz a la sombra. Solo en planos de manos; nunca en producto."),
    ], ancho_izq=24 * mm)
    d.parrafo("El azulejo blanco es perfecto para proceso y manos, y lo peor "
              "posible para producto: el veteado compite con el jabon y el blanco "
              "mata el contraste.")
    d.alerta("La cartulina negra acostada muestra cada miga, cada pelusa y cada "
             "huella, y en macro se ven enormes. Rodillo quitapelusas al lado, y "
             "tocala solo por los bordes.")

    d.h2("Los tres montajes")

    d.h3("A · Mesa de trabajo")
    d.parrafo("Manos, proceso, ingredientes. El 90 % del dia 1.", tam=9.4, color=GRIS)
    diagrama(d, "mesa")
    d.parrafo("Es luz frontal y suave, y aqui esta bien: lo importante son las "
              "manos y el gesto, no la transparencia. Deja la estanteria al "
              "fondo, desenfocada.")

    d.h3("B · Joya")
    d.parrafo("Producto terminado, el jabon que suda, portadas.", tam=9.4, color=GRIS)
    diagrama(d, "joya")
    d.alerta("El error de siempre: subir la luz de recorte. Si compite con la de "
             "atras, perdiste el efecto. Al 25 % o menos.")

    d.h3("C · Rayos")
    d.parrafo("El corte y las causticas.", tam=9.4, color=GRIS)
    diagrama(d, "rayos")
    d.parrafo("La diferencia con el montaje B es quitar el difusor y bajar la "
              "luz. Con luz dura y rasante, el jabon proyecta dibujos de luz "
              "sobre la cartulina, y al cortarlo esos dibujos se parten y se "
              "reorganizan.")
    d.parrafo("Es el plano que casi nadie del nicho puede hacer, porque casi "
              "nadie trabaja material transparente.")

    d.h2("Antes del dia 1: una tarde de prueba")
    d.casillas([
        "Separa la mesa y comprueba que entra una luz atras",
        "Tapa la ventana, o espera a la noche",
        "Graba 20 s con las 3 luces adelante",
        "Graba 20 s con el montaje joya",
        "Ponlos lado a lado en Resolve",
        "*Con los tubos macro: a que distancia enfoca? Anotalo",
        "*A f/8 y luz a 50 cm: que ISO necesitas? Anotalo",
    ])
    d.parrafo("Cuando tengas el montaje que te gusta, fotografialo con el celular "
              "y pega la foto en la pared con los ajustes escritos encima. Eso "
              "convierte 40 minutos de prueba y error en 5 minutos de repetir.")


# ═════════════════════════════════════════════════════════════
# 3 · Vocabulario
# ═════════════════════════════════════════════════════════════

def sec_vocabulario(d):
    d.portadilla("3", "Vocabulario",
                 "Las palabras que uso en los guiones y en el plan.")

    d.h2("Lo basico")
    d.tabla([
        ("Plano", "Un trozo de video grabado sin cortar, desde que le das REC hasta que paras."),
        ("Toma", "Cada intento de grabar el mismo plano. Uno que sale bien a la primera es raro."),
        ("Cuadro", "El rectangulo de la imagen. 'Entra en cuadro' = aparece en pantalla."),
    ], ancho_izq=20 * mm)

    d.h2("Tipos de plano")
    d.tabla([
        ("Macro", "Primerisimo plano: una gota, el filo del cuchillo entrando. Es el 70 % de este contenido, y es lo que tu lente NO puede hacer sin los tubos."),
        ("Detalle", "Cerrado pero no macro: una mano, un frasco, el termometro."),
        ("Medio", "Se ve la mesa y lo que hay encima. Da contexto."),
        ("Cenital", "Desde arriba, mirando recto hacia abajo. El plano clasico de cocina."),
    ], ancho_izq=20 * mm)

    d.h2("Movimiento y tiempo")
    d.tabla([
        ("60 fps", "Grabar 60 cuadros por segundo. Al verlo a 24, el movimiento va 2.5 veces mas lento. Para vertidos, gotas, desmolde, vapor."),
        ("Time-lapse", "Lo contrario: una foto cada X segundos, y el tiempo corre acelerado. Para el derretido y la gota de sudor."),
        ("Bucle", "Un video cuyo ultimo cuadro empalma con el primero. La gente lo ve tres veces sin darse cuenta, y esa es la senal mas fuerte que hay."),
    ], ancho_izq=20 * mm)

    d.h2("Luz")
    d.tabla([
        ("Contraluz", "La luz esta DETRAS del objeto, apuntando a la camara. Es lo que hace brillar al jabon transparente."),
        ("Difusor", "Algo blanco y translucido entre la luz y el objeto. Convierte luz dura en luz suave."),
        ("Rasante", "La luz llega casi paralela a la mesa, muy baja. Alarga sombras y revela textura."),
        ("Recorte", "Luz secundaria, arriba y de lado, que marca el borde. Va SIEMPRE mucho mas floja que la principal."),
        ("Negativo", "Cartulina negra al lado. No ilumina: quita luz y da volumen."),
        ("Causticas", "Los dibujos de luz que un objeto transparente proyecta. Lo que hace un vaso de agua al sol."),
    ], ancho_izq=20 * mm)

    d.h2("Sonido")
    d.tabla([
        ("Foley", "Sonidos grabados APARTE, en silencio, con el microfono muy cerca, y montados despues. Es como se hace el ASMR de verdad."),
        ("Voz en off", "La voz narrando sin que se vea a la persona. Se graba en otro momento y se monta encima."),
        ("Ambiente", "El sonido del cuarto en silencio. 30 segundos por sesion, para que la mezcla no suene pegoteada."),
        ("Palmada", "Una palmada al aire al empezar cada toma. El pico se ve en las dos ondas y el editor las alinea solo."),
    ], ancho_izq=20 * mm)

    d.h2("Las frases que confundian")

    d.h3("Cubos cayendo")
    d.parrafo("La base de glicerina viene en un bloque grande. Se corta en cubos "
              "de unos 3 cm para que se derrita parejo.")
    d.parrafo("El plano son esos cubos cayendo dentro de la olla. Se ve muy bien: "
              "cubos transparentes rebotando y quedandose quietos.")

    d.h3("Rodar las tres partes juntas")
    d.parrafo("La serie del olor a huevo son tres videos distintos, que se "
              "PUBLICAN en tres dias distintos. Pero el material de los tres se "
              "GRABA en la misma sesion, seguido, en 45 minutos.")
    d.parrafo("Es por continuidad: si grabas la parte 1 hoy y la 3 en dos "
              "semanas, la luz cambio, las manos estan distintas y se nota. "
              "Grabadas juntas, las tres parecen la misma historia, que es lo que "
              "son.")

    d.h3("Plano sostenido, sin cortar")
    d.parrafo("Grabar la accion entera sin parar la camara. Se usa en las "
              "demostraciones: si cortas a mitad de la mezcla que se enturbia, el "
              "que mira asume truco y perdiste toda la fuerza.")

    d.h3("Volar los altos")
    d.parrafo("Que las zonas claras salgan tan brillantes que queden blanco puro, "
              "sin detalle. Con jabon transparente es el error de exposicion mas "
              "facil, porque la luz que lo atraviesa es lo mas brillante del "
              "cuadro. Y es justo lo que hace bonito al material.")


# ═════════════════════════════════════════════════════════════
# 4 · Día 1
# ═════════════════════════════════════════════════════════════

def sec_dia1(d):
    d.portadilla("4", "Dia 1 · Humedo",
                 "Elaboracion, crema y demostraciones. Unas 8 h.")

    d.caja("Todo se rueda MUDO. La voz va aparte, otro dia, con la Focusrite. "
           "Hoy el Maono solo graba foley y ambiente.", "Recuerda")
    d.parrafo("Montaje de luz de casi todo el dia: A · MESA DE TRABAJO.")

    d.h2("07:30 · Montaje  (30 min)")
    d.casillas([
        "Mesa separada de la pared 70-80 cm",
        "Ventana tapada, o de noche",
        "Luces a 50-70 cm de la mesa",
        "ISO 400 · 180 grados · balance MEDIDO Y FIJO",
        "BRAW Q5 · 6K horizontal · focus peaking",
        "Bateria falsa enchufada · SSD conectado",
        "Mesa limpia · alcohol y paño al lado",
        "Ingredientes EN EL ORDEN QUE ENTRAN",
        "*Grabar 30 s de sala en silencio",
    ])

    d.h2("Bloque 1 · Pesaje y polvos  (30 min)")

    d.plano("1.1", "La balanza clavando el gramo", [
        ("Se ve", "La pantalla de la balanza y una cuchara echando polvo, los numeros subiendo hasta quedarse en el numero exacto."),
        ("Camara", "Macro, a 25-30 cm, a la altura de la pantalla y un poco en diagonal para que no refleje."),
        ("Accion", "Echar despacio y frenar justo antes. El ultimo poquito, de a pizcas."),
        ("Rueda", "4 o 5 ingredientes, 15 s cada uno."),
        ("Para", "Banco, cuanto cuesta este jabon, aperturas."),
    ], prioridad=2)

    d.plano("1.2", "La cuchara entrando en el polvo", [
        ("Se ve", "El polvo liso en el frasco, y la cuchara hundiendose y dejando el surco."),
        ("Camara", "Macro cenital, justo encima, a 20 cm."),
        ("Accion", "Entrar despacio, sacar, y dejar ver el hueco."),
        ("Rueda", "Curcuma, carbon, arcilla y cafe. 10 s cada uno."),
        ("Para", "Banco. De los planos mas satisfactorios que hay."),
    ])

    d.plano("1.3", "Polvo cayendo", [
        ("Se ve", "El polvo cayendo desde la cuchara al vaso, en el aire."),
        ("Camara", "Macro, de lado, a 25 cm. A contraluz suave si puedes: el polvo en el aire solo se ve bien asi."),
        ("Accion", "Dejarlo caer desde 15 cm, en hilo fino."),
        ("Rueda", "60 fps. 3 tomas por polvo."),
    ])

    d.plano("1.4", "Cenital de todo ordenado", [
        ("Se ve", "Todos los ingredientes pesados, en cuencos, en el orden en que entran."),
        ("Camara", "Cenital, lo mas arriba que llegue el tripode, mirando recto abajo."),
        ("Accion", "Ninguna. Opcional: una mano entra y corrige un cuenco."),
        ("Rueda", "15 s quieto y 15 con la mano."),
        ("Para", "Portada de varios videos."),
    ], prioridad=2)

    d.h2("Bloque 2 · Derretido  (25 min)")

    d.plano("2.1", "Cortar la base en cubos", [
        ("Se ve", "El bloque de glicerina y el cuchillo cortandolo en cubos de 3 cm."),
        ("Camara", "Detalle, a 40 cm, en diagonal desde arriba."),
        ("Rueda", "20 s."),
    ])

    d.plano("2.2", "Los cubos cayendo en la olla", [
        ("Se ve", "Los cubos transparentes cayendo en la olla vacia, rebotando y quedandose quietos."),
        ("Camara", "Macro o detalle, mirando dentro de la olla desde arriba en diagonal, a 30 cm."),
        ("Accion", "Echarlos de a punados desde 20 cm, no todos de golpe."),
        ("Rueda", "60 fps, 3 tomas."),
    ], prioridad=2)

    d.plano("2.3", "Derritiendose", [
        ("Se ve", "Los cubos perdiendo las esquinas y volviendose liquido."),
        ("Camara", "Fija, sin tocar."),
        ("Rueda", "Time-lapse, o 3-4 min de video normal que se acelera despues."),
    ])

    d.plano("2.4", "El termometro entrando", [
        ("Se ve", "El termometro hundiendose y el numero estabilizandose."),
        ("Camara", "Macro, con el numero LEGIBLE."),
        ("Rueda", "15 s, esperando que el numero se quede quieto."),
    ], prioridad=2)

    d.plano("2.5", "Vapor a contraluz", [
        ("Se ve", "El vapor subiendo de la olla, encendido por detras."),
        ("Camara", "De lado, a 50 cm, fondo oscuro."),
        ("Luz", "Mover una luz DETRAS de la olla, apuntando a la camara pero tapada del lente. De frente el vapor es invisible."),
        ("Rueda", "60 fps, 20 s."),
    ])

    d.h2("Bloque 3 · La barra de capas  (80 min)")
    d.clave("El bloque mas importante del dia. De aqui sale la materia prima de "
            "casi todo el dia 2.", "Atencion")

    d.plano("3.1", "Colorear la primera capa", [
        ("Se ve", "La gota de colorante cayendo en la base y deshaciendose en espiral."),
        ("Camara", "Macro cenital, a 25 cm, mirando dentro de la jarra."),
        ("Accion", "Dejar caer la gota y NO remover todavia. Grabar la espiral sola. Despues remover."),
        ("Rueda", "60 fps, 4 tomas (una por color)."),
    ])

    d.plano("3.2", "Verter la capa 1", [
        ("Se ve", "El chorro entrando al molde vacio y llenando el fondo."),
        ("Camara", "Dos angulos: de lado a ras de mesa (para ver subir el nivel) y cenital (para ver como se extiende)."),
        ("Accion", "Verter lento y continuo, desde 10 cm de alto."),
        ("Rueda", "60 fps. Como solo puedes verter una vez por capa, elige un angulo por capa y ve rotando."),
    ], prioridad=2)

    d.caja("Durante cada espera de 15-20 min, NO te quedes mirando el molde. "
           "Rueda planos de banco: manos secandose, frasco cerrandose, espatula "
           "raspando la jarra, agua en el fregadero, gota cayendo a 60 fps, "
           "termometro bajando, reflejo del taller en el acero. Y ve preparando "
           "la tanda 2.", "Las esperas")

    d.plano("3.3", "El dedo tocando la superficie", [
        ("Se ve", "La yema apoyandose en la capa que enfria, y la superficie cediendo un poquito sin romperse."),
        ("Camara", "MACRO, muy cerca, a ras. El plano mas cerrado del bloque."),
        ("Accion", "Tocar suave, mantener un segundo, levantar. Se deberia ver la marca desaparecer despacio."),
        ("Rueda", "4 o 5 tomas. Es dificil de clavar."),
        ("Para", "El plano clave del video de capas: explica 'firme pero todavia pegajosa' sin decirlo."),
    ], prioridad=3)

    d.plano("3.4", "Verter la capa 2 sobre una cuchara", [
        ("Se ve", "El chorro cayendo sobre el dorso de una cuchara apoyada en la capa anterior, y desde ahi extendiendose suave."),
        ("Camara", "Macro, de lado, a ras de mesa."),
        ("Accion", "El chorro pega en la cuchara y no directo en la capa: asi no la abolla ni la derrite."),
        ("Rueda", "60 fps, el vertido completo."),
    ], prioridad=2)

    d.parrafo("Repite el mismo esquema para las capas 3 y 4: espera, plano 3.3 "
              "otra vez, y vertido. En cada espera, mas banco.")

    d.plano("3.5", "El molde lleno", [
        ("Se ve", "Las 4 capas, visibles de lado."),
        ("Camara", "De lado a ras (para que se lea el orden) y un cenital."),
        ("Rueda", "15 s cada uno."),
    ])

    d.h2("Bloque 4 · El embed  (25 min)")
    d.plano("4.1", "El embed en el molde vacio", [
        ("Camara", "Cenital y de lado."),
        ("Rueda", "15 s."),
    ])
    d.plano("4.2", "Verter alrededor del embed", [
        ("Se ve", "La base entrando y subiendo alrededor del objeto hasta cubrirlo."),
        ("Accion", "Verter despacio por un costado, NO encima del objeto."),
        ("Rueda", "60 fps, el vertido completo."),
    ], prioridad=2)
    d.plano("4.3", "El objeto suspendido", [
        ("Se ve", "A traves de la base todavia liquida, el objeto flotando dentro."),
        ("Camara", "Macro de lado, con una luz por detras si se puede."),
        ("Rueda", "20 s."),
    ])

    d.h2("10:40 · Descanso  (25 min)")
    d.parrafo("Revisar material 5 minutos, no mas: solo confirmar que hay imagen "
              "y que el enfoque esta. Cambiar bateria.")

    d.h2("Bloque 5 · La barra simple  (20 min)")
    d.plano("5.1", "Verter directo", [
        ("Rueda", "60 fps, 1 toma. Sin ceremonia."),
    ])
    d.plano("5.2", "Espolvorear el exfoliante", [
        ("Se ve", "La avena o el cafe cayendo sobre la superficie liquida y quedandose flotando."),
        ("Camara", "Macro cenital, a 20 cm."),
        ("Accion", "Espolvorear con los dedos, en lluvia."),
        ("Rueda", "60 fps, 3 tomas."),
    ])

    d.h2("Bloque 6 · Crema mal a proposito  (50 min)")
    d.alerta("Es el unico bloque con riesgo real. Agua a 95 grados salpicando "
             "cerca de las manos y de la camara. Guantes, mangas largas, camara "
             "mas lejos o protegida. Cantidades chicas: 200 g por jarra.")

    d.plano("6.1", "Las dos jarras humeando", [
        ("Camara", "Plano medio, de frente, a 60 cm."),
        ("Rueda", "15 s."),
        ("Para", "Apertura del video."),
    ])
    d.plano("6.2", "Termometro en la jarra A: 95 grados", [
        ("Camara", "Macro, numero LEGIBLE."),
        ("Rueda", "15 s."),
    ], prioridad=2)
    d.plano("6.3", "Termometro en la jarra B: 72 grados", [
        ("Camara", "EXACTAMENTE el mismo angulo y distancia que 6.2. Marca la posicion del tripode con cinta antes de mover nada."),
        ("Por que", "Si los dos planos son identicos salvo el numero, el corte es una comparacion. Si son distintos, son dos planos sueltos y el argumento se pierde."),
    ], prioridad=2)
    d.plano("6.4", "Batir la caliente: SE CORTA", [
        ("Se ve", "La mezcla batiendose y separandose: aceitosa, granulosa, no liga."),
        ("Camara", "Macro cenital, dentro de la jarra."),
        ("Rueda", "UN SOLO PLANO, SIN CORTAR, desde antes de batir hasta que se vea claramente cortada. Puede ser 1-2 min: da igual, se acelera despues."),
    ], prioridad=3)
    d.plano("6.5", "Batir la tibia: AGARRA", [
        ("Camara", "El mismo encuadre que 6.4."),
        ("Rueda", "Un solo plano."),
    ], prioridad=2)
    d.plano("6.6", "Las dos, lado a lado", [
        ("Camara", "Cenital, las dos en cuadro."),
        ("Rueda", "20 s."),
    ])

    d.h2("Bloque 7 · El olor a huevo  (45 min)")
    d.caja("Son tres videos que se publican en tres dias distintos, pero el "
           "material de los tres se graba AHORA, seguido. Grabadas juntas, las "
           "tres parecen la misma historia.", "Las tres partes juntas")
    d.parrafo("Antes de empezar: prepara y ETIQUETA las tres muestras de crema.")

    d.plano("7.1", "Dedo tomando crema del frasco", [
        ("Se ve", "El dedo entrando en la crema y saliendo con un poco, que se despega."),
        ("Camara", "Macro, a 20 cm."),
        ("Accion", "Empieza con el dedo YA DENTRO. No entres en cuadro: la accion ya esta pasando cuando arranca el plano."),
        ("Rueda", "4 tomas."),
    ], prioridad=2)
    d.plano("7.2", "Crema extendiendose en el dorso", [
        ("Se ve", "La crema pasando de bolita blanca a capa transparente."),
        ("Camara", "Macro, casi cenital sobre la mano."),
        ("Rueda", "3 tomas de 20 s."),
    ])
    d.plano("7.3", "Crema base sola", [
        ("Camara", "El MISMO encuadre que 7.2."),
        ("Rueda", "2 tomas."),
        ("Para", "'La crema base sola no huele'."),
    ])
    d.plano("7.4", "Colageno en una mano, elastina en la otra", [
        ("Camara", "Detalle con las dos manos, y despues cada una en macro."),
        ("Rueda", "20 s."),
    ], prioridad=2)
    d.plano("7.5", "Las dos manos frotandose", [
        ("Camara", "Macro, a 25 cm."),
        ("Rueda", "4 tomas de 20 s."),
        ("Para", "CIERRA la parte 1 y ABRE la parte 2. Un solo archivo en los dos videos: esa continuidad es lo que hace que la serie sea serie."),
    ], prioridad=3)
    d.plano("7.6", "Los dos frascos, luz plana", [
        ("Se ve", "El ambar y el de plastico, iluminados normal, sin drama."),
        ("Rueda", "15 s."),
        ("Para", "Cierre de la parte 2. Que se vean como lo que son para que el golpe llegue en la parte 3."),
    ])
    d.plano("7.7", "LA LUZ ATRAVESANDO", [
        ("Se ve", "Una luz por detras. En el plastico transparente la luz lo atraviesa y lo enciende por dentro. En el ambar, SE FRENA."),
        ("Camara", "De lado, un poco por debajo del frasco, fondo oscuro."),
        ("Luz", "UNA sola luz detras, apuntando a camara. Las otras dos apagadas."),
        ("Accion", "Rodar el de plastico 20 s. SIN MOVER NADA, cambiarlo por el de ambar y rodar otros 20 s."),
        ("Por que", "Si los dos planos son identicos salvo el frasco, el corte es una comparacion demoledora. Si mueves la camara, no prueban nada."),
    ], prioridad=3)
    d.clave("Si hoy tienes que sacar UN solo plano perfecto, es el 7.7. Dedicale "
            "20 minutos sin culpa.")
    d.plano("7.8", "El frasco entrando en un cajon", [
        ("Rueda", "15 s."),
    ])
    d.plano("7.9", "Manos apoyadas, quietas", [
        ("Se ve", "Las manos en reposo. El plano de cierre."),
        ("Rueda", "20 s."),
    ])

    d.h2("Bloque 8 · El colageno  (25 min)")
    d.plano("8.1", "Polvo volviendo al frasco", [
        ("Se ve", "La cuchara devolviendo el colageno al frasco en vez de echarlo a la mezcla."),
        ("Camara", "Macro cenital."),
        ("Rueda", "3 tomas."),
        ("Para", "Apertura. El gesto de renuncia."),
    ], prioridad=2)
    d.plano("8.2", "El cronometro arrancando", [
        ("Se ve", "El cronometro en el borde del lavamanos y un dedo dandole arranque."),
        ("Camara", "Macro, numeros grandes y legibles."),
        ("Para", "Este plano ES el argumento entero del video."),
    ], prioridad=3)
    d.plano("8.3", "Manos enjabonandose, cronometro corriendo", [
        ("Camara", "Detalle que abarque las manos y el cronometro."),
        ("Rueda", "La accion completa, 40 s."),
    ], prioridad=2)
    d.plano("8.4", "El agua cortandose", [
        ("Accion", "Que coincida con los 20 segundos del cronometro. Ensayalo."),
        ("Rueda", "3 tomas."),
    ], prioridad=2)
    d.plano("8.5", "Tira de pH sobre la espuma", [
        ("Se ve", "La tira apoyada en la espuma y el color virando."),
        ("Camara", "Macro."),
        ("Accion", "Una medicion DE VERDAD. Si se nota trucada, se cae todo el video."),
        ("Rueda", "30 s, esperando el viraje."),
    ], prioridad=2)
    d.plano("8.6", "La tira contra la escala", [
        ("Se ve", "La tira usada al lado de la escala del bote, cayendo en 9-10."),
        ("Camara", "Macro, las dos cosas en cuadro."),
    ])

    d.h2("Bloque 9 · Las demostraciones  (45 min)")
    d.alerta("Prueba la demostracion 9.1 SIN CAMARA primero. Si la mezcla no se "
             "enturbia visiblemente, sube la concentracion hasta que se vea y "
             "dilo en el video. Un video de demostracion donde no se ve nada es "
             "peor que no hacerlo.")
    d.plano("9.1", "Los dos que se anulan", [
        ("Se ve", "Dos vasos con liquidos transparentes. Se vierte uno en el otro y la mezcla se enturbia."),
        ("Camara", "Macro de lado, a contraluz, fondo negro, camara BAJA a la altura del liquido."),
        ("Rueda", "UN SOLO PLANO, SIN CORTAR, desde antes de verter hasta que el turbio se asiente. Deja la camara corriendo despues: el sedimento cayendo puede ser el mejor plano."),
        ("Repite", "3 o 4 veces, con vasos limpios cada vez."),
    ], prioridad=3)
    d.plano("9.2", "La pimienta que huye", [
        ("Se ve", "Un plato con agua y pimienta flotando. Se toca el centro con un dedo mojado en jabon y la pimienta sale disparada a los bordes."),
        ("Camara", "Cenital, macro."),
        ("Rueda", "60 fps, 3 tomas, con agua limpia cada vez."),
        ("Para", "Explica que es un tensioactivo en dos segundos, sin una palabra."),
    ], prioridad=2)

    d.h2("15:35 · Antes de apagar")
    d.casillas([
        "*UNA REBANADA SIN ENVOLVER en el cuarto mas humedo de la casa",
        "Time-lapse de una gota creciendo (1 disparo cada 10 s)",
        "Las tres tandas tapadas, en sitio fresco, para cortar manana",
    ])

    d.h2("15:45 · Luces off · Foley  (40 min)")
    d.parrafo("Camara apagada. Luces apagadas. Casa en silencio. El Maono a 5-15 cm.")
    d.casillas([
        "verter fino", "verter grueso", "remover con espatula",
        "burbujas subiendo", "gota cayendo", "cuchara entrando en polvo",
        "polvo cayendo", "tamizar", "batidora", "*ambiente de cuarto (30 s)",
    ])
    d.parrafo("Cada uno, 3 o 4 versiones. Despues eliges.")


# ═════════════════════════════════════════════════════════════
# 5 · Día 2
# ═════════════════════════════════════════════════════════════

def sec_dia2(d):
    d.portadilla("5", "Dia 2 · Seco",
                 "Corte y producto terminado. Unas 6 h.")

    d.caja("Hoy no se fabrica nada: se corta y se muestra lo de ayer. Y no hay "
           "sesion de voz: eso libera 75 minutos que van al bloque del corte y a "
           "un bloque nuevo al final.", "Recuerda")

    d.h2("08:30 · Montaje A  (15 min)")
    d.parrafo("Mesa de trabajo: luz suave frontal, azulejo blanco, fondo la "
              "estanteria desenfocada.")

    d.h2("Bloque 1 · El recetario  (40 min)")
    d.parrafo("El video de origen de la marca. Se rueda una vez y trabaja para "
              "siempre.")

    d.plano("1.1", "La mano abriendo el cuaderno", [
        ("Camara", "Macro cenital, a 30 cm, mirando recto abajo."),
        ("Accion", "Abrir despacio, dejar que la pagina se asiente."),
        ("Rueda", "3 tomas de 20 s."),
    ], prioridad=2)
    d.plano("1.2", "Recorriendo la letra a mano", [
        ("Se ve", "La caligrafia, las tachaduras, los numeros corregidos encima de otros."),
        ("Camara", "Macro cenital, moviendola despacio sobre el papel como leyendo."),
        ("Rueda", "4 tomas de 15 s, por zonas distintas."),
    ])
    d.plano("1.3", "La mancha de grasa en el papel", [
        ("Se ve", "Una mancha translucida donde el papel absorbio crema."),
        ("Camara", "Macro, casi rasante para que se vea el brillo."),
        ("Por que", "Es la evidencia fisica de veinte anos de uso. No se puede fingir, y el ojo lo sabe."),
    ], prioridad=2)
    d.plano("1.4", "Manos con crema intentando pasar una hoja", [
        ("Se ve", "Los dedos untados resbalando en el papel, sin poder pasar la pagina."),
        ("Accion", "Intentarlo de verdad, con torpeza. Que se vea el problema."),
        ("Rueda", "3 tomas."),
    ], prioridad=2)
    d.plano("1.5", "EL BOTON SONANDO", [
        ("Se ve", "Un dedo toca el boton de escuchar. SE OYE el telefono leyendo el paso, mientras las manos vuelven a trabajar."),
        ("Camara", "Detalle que abarque el telefono y las manos."),
        ("Audio", "Graba el sonido del telefono DE VERDAD con el Maono cerca. No lo pongas en la edicion. Que se oiga un poco lejos, con el eco del cuarto."),
        ("Rueda", "4 tomas de 30 s."),
        ("Por que", "Contiene la historia entera sin explicarla: una mujer con las manos ocupadas, una receta que le habla, y alguien que penso en eso."),
    ], prioridad=3)
    d.plano("1.6", "El cuaderno y el telefono juntos", [
        ("Camara", "Cenital, los dos en cuadro."),
        ("Rueda", "20 s."),
    ])
    d.plano("1.7", "La mano acariciando la tapa", [
        ("Rueda", "20 s. Es el cierre."),
    ])
    d.alerta("Que la receta NO se lea completa en pantalla, salvo que quieran que "
             "sea publica. Planos cerrados y desenfoque parcial.")

    d.h2("09:25 · Cambio a montaje C · Rayos  (20 min)")
    d.casillas([
        "Cartulina negra ACOSTADA sobre el azulejo",
        "Cartulina negra PARADA de fondo",
        "Luz 1 detras, BAJA y rasante, SIN difusor",
        "Luces 2 y 3 APAGADAS",
        "Camara baja, casi a la altura de la mesa",
        "*Rodillo quitapelusas: la cartulina negra muestra todo",
    ])
    d.parrafo("Antes de rodar nada, comprueba las causticas: pon una barra, mira "
              "el monitor y busca los dibujos de luz proyectados. Si no aparecen, "
              "baja mas la luz y acercala.")

    d.h2("Bloque 2 · El corte  (70 min)")
    d.clave("El bloque mas importante de los dos dias.")

    d.h3("Primero, ensaya con la barra simple")
    d.parrafo("La tanda 3 existe para esto. Corta dos o tres rebanadas SIN "
              "GRABAR, para saber cuanta fuerza pide el cuchillo, si se pega, y a "
              "que velocidad queda bien. Nunca ensayes con la barra de capas.")

    d.h3("El bucle, paso a paso")
    d.casillas([
        "Monta el plano y NO MUEVAS LA CAMARA para nada",
        "*Marca con cinta POR DEBAJO donde va apoyada la barra",
        "Corta la barra de capas. Guarda la toma",
        "Pon otra barra en la MISMA posicion exacta",
        "Rueda LA MISMA ENTRADA DE CUCHILLO otra vez",
    ])
    d.parrafo("Esa segunda entrada es el FINAL del video, y empalma con el "
              "principio sin que se note. Sin la marca de cinta, el bucle salta.")

    d.plano("2.1", "La secuencia del corte", [
        ("a", "El cuchillo YA entrando, causticas proyectadas en la cartulina."),
        ("b", "El corte avanzando, la luz partiendose en dos."),
        ("c", "EL QUIEBRE: la rebanada se separa."),
        ("d", "La rebanada cayendo de lado (60 fps)."),
        ("e", "MACRO del corte transversal: las capas."),
        ("f", "Una mano girando la rebanada hacia la luz."),
        ("g", "La misma entrada de cuchillo otra vez."),
        ("Camara", "Baja, casi a la altura de la mesa, macro, a 25-30 cm."),
    ], prioridad=3)
    d.caja("El plano (e) es la 'carga' del video: es lo que hace que este no sea "
           "un video de cortar jabon mas. Sin el, no lo publiques.", "Ojo con esto")

    d.h3("Las variantes, sin mover nada")
    d.casillas([
        "Corte del EMBED, revela lo de adentro",
        "Corte multiple: 5 rebanadas seguidas",
        "Corte lento a 60 fps, una sola rebanada",
        "Corte FALLIDO: se desmigaja. Publicarlo igual",
        "Solo las causticas moviendose, sin cuchillo",
    ])
    d.parrafo("El corte fallido no es descarte. En 2026 la imperfeccion es la "
              "credencial de que esto lo hizo una persona y no una maquina.")

    d.h2("Bloque 3 · Desmolde y polvos  (30 min)")
    d.plano("3.1", "El desmolde a 60 fps", [
        ("Se ve", "El molde doblandose y la barra despegandose."),
        ("Camara", "De lado, a 30 cm."),
        ("Rueda", "60 fps, 3 tomas."),
    ], prioridad=2)
    d.plano("3.2", "Polvos a contraluz", [
        ("Se ve", "Curcuma, carbon y cafe cayendo, encendidos por detras."),
        ("Rueda", "60 fps, 3 tomas por polvo."),
        ("Nota", "Este montaje es perfecto para esto. Aprovechalo ahora."),
    ])

    d.h2("12:10 · Cambio a montaje B · Joya  (20 min)")
    d.casillas([
        "Cartulina negra acostada y parada",
        "Luz 1 detras CON DIFUSOR, a 15-20 cm del jabon",
        "Luz 2 de recorte, arriba y de lado, AL 25% o menos",
        "Cartulina negra de canto al otro lado (negativo)",
        "Luz 3 apagada · camara baja",
        "*Limpiar todo otra vez",
    ])

    d.h2("Bloque 4 · Producto terminado  (35 min)")
    d.plano("4.1", "La barra de capas girando", [
        ("Se ve", "La barra girando despacio, las capas encendidas por dentro."),
        ("Camara", "Baja, macro, fondo negro."),
        ("Accion", "Base giratoria de exhibir tortas, o a mano muy despacio."),
        ("Rueda", "30 SEGUNDOS SEGUIDOS, sin cortar."),
        ("Para", "Los primeros 5 s abren el video de capas y los ultimos 5 lo cierran. Un archivo, dos usos."),
    ], prioridad=3)
    d.plano("4.2", "Macro recorriendo las capas", [
        ("Rueda", "4 tomas de 15 s."),
    ])
    d.plano("4.3", "Cada jabon girando", [
        ("Rueda", "20 s cada uno."),
        ("Para", "Portadas."),
    ])

    d.h2("Bloque 5 · El jabon que suda  (30 min)")
    d.parrafo("Las gotas SOLO se ven a contraluz. De frente son invisibles. Por "
              "eso este bloque va aqui y no en el montaje de mesa.")
    d.plano("5.1", "Las gotas brillando", [
        ("Camara", "Macro, muy cerca, casi rasante."),
        ("Rueda", "4 tomas de 20 s."),
    ], prioridad=3)
    d.plano("5.2", "Un dedo tocando una gota", [
        ("Se ve", "La gota corriendose al tocarla y dejando un rastro."),
        ("Rueda", "3 tomas."),
    ])
    d.plano("5.3", "La barra industrial, seca", [
        ("Camara", "El MISMO encuadre que 5.1, para que la comparacion sea limpia."),
        ("Nota", "Sin logo visible. Si tiene relieve, ruedala desde otro angulo o lijalo."),
    ], prioridad=2)
    d.plano("5.4", "Manos envolviendo el jabon", [
        ("Rueda", "30 s. Es el cierre."),
    ])

    d.h2("Bloque 6 · Espuma y agua  (20 min)")
    d.parrafo("Con las sobras del corte.")
    d.casillas([
        "Burbujas naciendo y muriendo, macro extremo a contraluz",
        "Jabon bajo el chorro (60 fps)",
        "Frotar entre las manos, la espuma creciendo",
    ])

    d.h2("Bloque 7 · Una palabra del diccionario  (25 min)")
    d.parrafo("Serie de videos de 15 segundos: una palabra tecnica por video, "
              "explicada en lenguaje llano. Sale directo del diccionario del "
              "sistema, y la narracion se graba despues con las demas.")
    d.parrafo("Hoy solo se ruedan las imagenes de apoyo, que son cortisimas:")
    d.tabla([
        ("Emulsionante", "La crema cremosa de la jarra B, macro"),
        ("Tensioactivo", "La espuma naciendo"),
        ("Conservante", "El frasco, la gota cayendo"),
        ("Quelante", "Agua de la llave llenando un vaso"),
        ("Fase grasa", "Los aceites y mantecas juntos"),
        ("Oclusivo", "La manteca de karite en la mano"),
    ], ancho_izq=26 * mm)
    d.parrafo("15-20 s por palabra. Es rapidisimo y son seis o siete videos mas.")

    d.h2("14:40 · Luces off · Foley  (30 min)")
    d.casillas([
        "cuchillo entrando lento", "cuchillo entrando rapido",
        "*EL QUIEBRE (4 o 5 versiones)", "rebanada cayendo en la mesa",
        "rebanada sobre rebanada", "desmoldar, el pop",
        "barra golpeando la mesa", "dos barras frotandose",
        "envolver en papel", "jabon bajo el chorro",
    ])
    d.clave("El quiebre es el sonido mas importante de todo el proyecto: es el "
            "climax del video de corte. Grabalo cuatro o cinco veces y elige "
            "despues. Si tu grabadora hace 96 kHz, usalo: despues le bajas medio "
            "tono y suena el doble de grave.")


# ═════════════════════════════════════════════════════════════
# 6 · La voz
# ═════════════════════════════════════════════════════════════

def sec_voz(d):
    d.portadilla("6", "La voz, despues",
                 "Con la Focusrite, en otro momento y con calma.")

    d.h2("El orden que funciona")
    d.tabla([
        ("1", "Rodar los dos dias, todo mudo"),
        ("2", "Montar un CORTE APROXIMADO de cada video, sin voz"),
        ("3", "Sesion de voz: ella narra MIRANDO ese corte en una pantalla"),
        ("4", "Montaje fino: ajustar la imagen a lo que dijo"),
    ], ancho_izq=8 * mm)

    d.clave("El paso 3 es la clave, y casi nadie lo hace. Que ella vea en pantalla "
            "lo que esta describiendo le da el ritmo sola, hace que describa lo "
            "que VE y no lo que recuerda, y les muestra los huecos: 'aca falta un "
            "plano de la cuchara'.")

    d.alerta("Si grabas la voz primero y despues montas la imagen a la fuerza, "
             "terminas usando planos que no querias solo para tapar una frase. Con "
             "el corte hecho, la voz se acomoda a lo que de verdad tienes.")

    d.h2("Un microfono bueno capta MAS cuarto")
    d.parrafo("El lavalier esta pegado al pecho y casi solo oye la voz. Un "
              "condensador a 20 cm oye la voz Y la sala: el eco, la nevera, el "
              "carro que pasa.")
    d.parrafo("O sea que pasar al microfono bueno no reemplaza el truco del "
              "closet: lo hace MAS necesario.")

    d.h2("Colocacion")
    d.vinetas([
        "A 15-20 cm de la boca. Ni pegado ni lejos",
        "Un poco de lado, o apuntando a la barbilla, no de frente",
        "Filtro antipop SI O SI. A esa distancia, una 'p' sin filtro revienta la toma y no tiene arreglo",
        "Que pueda apoyar los codos: una postura incomoda se oye en la voz",
    ])

    d.h2("Ajustes de la Focusrite")
    d.tabla([
        ("Formato", "48 kHz / 24 bits"),
        ("Fantasma", "+48 V encendida si el microfono es de condensador"),
        ("Ganancia", "Que los picos lleguen a -6 dB y ninguno toque el rojo"),
        ("Monitoreo", "Directo encendido y audifonos puestos: casi todo el mundo habla mejor cuando se oye"),
        ("Modo Air", "Pruebalo, pero no lo des por hecho: levanta agudos y en algunas voces suena aspero. Graba 2 min con y sin"),
    ], ancho_izq=22 * mm)

    d.alerta("El clipping es el UNICO error irreversible. Si el indicador toca el "
             "rojo, esa parte de la onda ya no existe: no hay programa que la "
             "devuelva. Graba bajo y sube despues.")

    d.h2("El cuarto")
    d.parrafo("El enemigo no es el ruido: es el ECO. Un cuarto vacio hace que la "
              "voz suene a bano, y eso no se arregla despues.")
    d.tabla([
        ("Closet", "Entre la ropa colgada. El mejor sitio de cualquier casa. Suena a chiste y es lo que usa gente que vive de su voz"),
        ("Cuarto", "Con cama, cortinas y alfombra. Muy bien"),
        ("Sala", "Con sofa. Aceptable"),
        ("Cocina", "No. Bano tampoco"),
    ], ancho_izq=20 * mm)

    d.h2("La regla que no hay que romper")
    d.clave("No le des un guion para leer. Dale el TEMA y los puntos, y dejala "
            "hablar. Una persona que no es actriz leyendo suena a persona "
            "leyendo, y ademas el texto lo escribiste tu: le vas a poner palabras "
            "que no son suyas.")
    d.parrafo("Las tres preguntas que desbloquean a cualquiera:")
    d.vinetas([
        "Que te paso la primera vez que hiciste esto?",
        "Que es lo que la gente hace mal?",
        "Que te preguntan siempre las clientas?",
    ])
    d.parrafo("La tercera es una mina de oro doble: te da contenido y te dice que "
              "quiere saber tu mercado.")

    d.h2("Orden de la sesion")
    d.parrafo("De lo mas facil a lo mas personal, para que entre en confianza:")
    d.tabla([
        ("1-5", "Capas, el colageno, por que suda, mal a proposito, los que se anulan"),
        ("6-8", "Olor a huevo, las tres partes SEGUIDAS"),
        ("9", "El recetario, al final y SIN GUION. Abranle el cuaderno y grabala hablando quince minutos"),
    ], ancho_izq=14 * mm)
    d.parrafo("Los primeros cinco minutos siempre se botan. Empiecen charlando de "
              "cualquier cosa con la grabadora ya andando: a veces lo mejor sale "
              "ahi.")


# ═════════════════════════════════════════════════════════════
# Montaje del documento
# ═════════════════════════════════════════════════════════════

SECCIONES = [sec_fabrica, sec_set, sec_vocabulario, sec_dia1, sec_dia2, sec_voz]


def construir(c, mapa_indice):
    """
    Se corre dos veces: la primera para saber en que pagina cae cada
    seccion, la segunda ya con el indice relleno.
    """
    d = Doc(c)
    portada(d)
    indice(d, mapa_indice)
    for seccion in SECCIONES:
        seccion(d)
    d.pie()
    c.showPage()
    return d.indice


def main(salida):
    # Pasada en falso, solo para numerar
    fantasma = canvas.Canvas(io.BytesIO(), pagesize=(W, H))
    mapa = construir(fantasma, {s.__name__: 0 for s in SECCIONES})

    c = canvas.Canvas(salida, pagesize=(W, H))
    c.setTitle("LILUS - Guia de rodaje (telefono)")
    c.setAuthor("LILUS")
    c.setSubject("Guia detallada de los dos dias de rodaje, en formato para leer en el telefono")
    construir(c, mapa)
    c.save()
    print("PDF generado:", salida)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "guia-lilus-telefono.pdf")
