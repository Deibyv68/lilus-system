# -*- coding: utf-8 -*-
"""
Hoja de rodaje LILUS, lista para imprimir y pegar en la pared del taller.

Se dibuja con primitivas del canvas y no con texto suelto porque las casillas,
los avisos y los marcadores de prioridad tienen que verse a un paso de
distancia. Las fuentes base de reportlab solo traen Latin-1, asi que cualquier
simbolo fuera de eso (estrellas, casillas, flechas) va dibujado, no escrito.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors

W, H = A4
M = 13 * mm                      # margen
CW = W - 2 * M                   # ancho util

TINTA = colors.HexColor("#1a1a1a")
GRIS = colors.HexColor("#6b6b6b")
GRIS_CLARO = colors.HexColor("#d8d8d8")
GRIS_FONDO = colors.HexColor("#f0efec")
ACENTO = colors.HexColor("#8a5a2b")     # tierra, sobrevive al blanco y negro
ALERTA = colors.HexColor("#a8321e")


# ─────────────────────────────────────────────────────────────
# Piezas de dibujo
# ─────────────────────────────────────────────────────────────

def casilla(c, x, y, lado=8):
    """Casilla vacia para ir tachando durante el rodaje."""
    c.setStrokeColor(GRIS)
    c.setLineWidth(0.9)
    c.rect(x, y, lado, lado, stroke=1, fill=0)


def puntos(c, x, y, n, r=2.0, sep=5.2):
    """Marcador de prioridad: mas puntos, menos negociable."""
    c.setFillColor(ACENTO)
    for i in range(n):
        c.circle(x + i * sep + r, y + r, r, stroke=0, fill=1)
    return n * sep


def triangulo_aviso(c, x, y, lado=9):
    """Triangulo con signo de admiracion, para los bloques con riesgo."""
    c.setFillColor(ALERTA)
    p = c.beginPath()
    p.moveTo(x + lado / 2, y + lado)
    p.lineTo(x, y)
    p.lineTo(x + lado, y)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(x + lado / 2, y + 1.6, "!")


def flecha(c, x, y, largo=9):
    """Flecha hacia la derecha."""
    c.setStrokeColor(GRIS)
    c.setLineWidth(0.9)
    c.line(x, y, x + largo, y)
    c.setFillColor(GRIS)
    p = c.beginPath()
    p.moveTo(x + largo + 3, y)
    p.lineTo(x + largo - 1, y + 2.2)
    p.lineTo(x + largo - 1, y - 2.2)
    p.close()
    c.drawPath(p, stroke=0, fill=1)


def barra_titulo(c, y, izq, der, alto=13 * mm):
    """Cabecera negra de cada pagina."""
    c.setFillColor(TINTA)
    c.rect(M, y - alto, CW, alto, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(M + 5 * mm, y - alto + 4.6 * mm, izq)
    c.setFont("Helvetica", 9)
    c.drawRightString(W - M - 5 * mm, y - alto + 4.9 * mm, der)
    return y - alto


def encabezado_seccion(c, y, texto, ancho=None):
    """Titulo de bloque, en versalitas sobre una linea."""
    ancho = ancho or CW
    c.setFillColor(ACENTO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M, y, texto.upper())
    c.setStrokeColor(GRIS_CLARO)
    c.setLineWidth(0.7)
    c.line(M, y - 2.4 * mm, M + ancho, y - 2.4 * mm)
    return y - 6.2 * mm


def envolver(c, texto, fuente, tam, ancho):
    """Parte un texto en lineas que quepan en el ancho dado."""
    c.setFont(fuente, tam)
    palabras, lineas, actual = texto.split(), [], ""
    for p in palabras:
        prueba = (actual + " " + p).strip()
        if c.stringWidth(prueba, fuente, tam) <= ancho:
            actual = prueba
        else:
            if actual:
                lineas.append(actual)
            actual = p
    if actual:
        lineas.append(actual)
    return lineas


# ─────────────────────────────────────────────────────────────
# Bloques de contenido
# ─────────────────────────────────────────────────────────────

def tira_ajustes(c, y):
    """Los ajustes de camara que no se tocan en todo el rodaje."""
    alto = 11 * mm
    c.setFillColor(GRIS_FONDO)
    c.rect(M, y - alto, CW, alto, stroke=0, fill=1)
    c.setStrokeColor(GRIS_CLARO)
    c.setLineWidth(0.7)
    c.rect(M, y - alto, CW, alto, stroke=1, fill=0)

    c.setFillColor(ACENTO)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(M + 3 * mm, y - 4.3 * mm, "AJUSTES FIJOS")

    c.setFillColor(TINTA)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(M + 26 * mm, y - 4.3 * mm,
                 "ISO 400   ·   OBTURADOR 180°   ·   BALANCE MEDIDO Y FIJO   ·   BRAW Q5   ·   6K HORIZONTAL")
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 7.6)
    c.drawString(M + 26 * mm, y - 8.4 * mm,
                 "En macro cerrar a f/5.6 - f/8   ·   60 fps solo para vertidos, gotas, desmolde y vapor   ·   el 6K se recorta a vertical al editar")
    return y - alto - 5 * mm


def horario(c, y, filas):
    """Tabla del dia: casilla, hora, bloque, duracion, nota."""
    x_cas = M
    x_hora = M + 6 * mm
    x_txt = M + 21 * mm
    x_dur = W - M - 3 * mm

    for f in filas:
        tipo = f.get("tipo", "bloque")

        if tipo == "pausa":
            c.setFillColor(GRIS_FONDO)
            c.rect(M, y - 1.2 * mm, CW, 5.6 * mm, stroke=0, fill=1)
            c.setFillColor(GRIS)
            c.setFont("Helvetica-Oblique", 8.5)
            c.drawString(x_hora, y + 0.4 * mm, f["hora"])
            c.drawString(x_txt, y + 0.4 * mm, f["texto"])
            c.setFont("Helvetica", 8)
            c.drawRightString(x_dur, y + 0.4 * mm, f.get("dur", ""))
            y -= 7.6 * mm
            continue

        if tipo == "fin":
            c.setStrokeColor(TINTA)
            c.setLineWidth(1.1)
            c.line(M, y + 4.4 * mm, M + CW, y + 4.4 * mm)
            c.setFillColor(TINTA)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(x_hora, y + 0.4 * mm, f["hora"])
            c.drawString(x_txt, y + 0.4 * mm, f["texto"])
            y -= 7 * mm
            continue

        casilla(c, x_cas, y - 0.4 * mm)

        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(x_hora, y + 0.4 * mm, f["hora"])

        cursor = x_txt
        if f.get("n"):
            c.setFillColor(ACENTO)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(cursor, y + 0.4 * mm, f["n"])
            cursor += 5.6 * mm

        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 9.8)
        c.drawString(cursor, y + 0.4 * mm, f["texto"])
        cursor += c.stringWidth(f["texto"], "Helvetica-Bold", 9.8) + 3.4 * mm

        if f.get("aviso"):
            triangulo_aviso(c, cursor, y)
            cursor += 13
        if f.get("pri"):
            cursor += puntos(c, cursor, y + 1.4, f["pri"]) + 3

        c.setFillColor(GRIS)
        c.setFont("Helvetica-Bold", 8.6)
        c.drawRightString(x_dur, y + 0.4 * mm, f.get("dur", ""))

        y -= 5.4 * mm
        for nota in f.get("notas", []):
            c.setFillColor(GRIS)
            c.setFont("Helvetica", 8)
            c.drawString(x_txt + 1 * mm, y + 0.6 * mm, nota)
            y -= 4.0 * mm
        y -= 1.8 * mm

    return y


def caja_planos(c, y, titulo, planos):
    """
    Recuadro destacado con los planos que no se pueden perder.

    El alto se mide envolviendo el texto de antemano, no se estima: con una
    estimacion, un plano con descripcion larga se sale de la caja y del papel.
    """
    ancho_txt = CW - 20 * mm
    filas = []
    alto = 11.5 * mm
    for fuerte, detalle in planos:
        lf = envolver(c, fuerte, "Helvetica-Bold", 9.4, ancho_txt)
        ld = envolver(c, detalle, "Helvetica", 8.2, ancho_txt)
        filas.append((lf, ld))
        alto += len(lf) * 4.4 * mm + len(ld) * 3.9 * mm + 2.9 * mm

    c.setFillColor(colors.HexColor("#fbf7f1"))
    c.rect(M, y - alto, CW, alto, stroke=0, fill=1)
    c.setStrokeColor(ACENTO)
    c.setLineWidth(1.4)
    c.rect(M, y - alto, CW, alto, stroke=1, fill=0)
    c.setFillColor(ACENTO)
    c.rect(M, y - alto, 2.2 * mm, alto, stroke=0, fill=1)

    c.setFillColor(ACENTO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(M + 6 * mm, y - 6 * mm, titulo.upper())

    yy = y - 11.5 * mm
    for i, (lf, ld) in enumerate(filas, 1):
        c.setFillColor(ACENTO)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(M + 6 * mm, yy - 0.6 * mm, str(i))

        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 9.4)
        for ln in lf:
            c.drawString(M + 12 * mm, yy, ln)
            yy -= 4.4 * mm

        c.setFillColor(GRIS)
        c.setFont("Helvetica", 8.2)
        for ln in ld:
            c.drawString(M + 12 * mm, yy, ln)
            yy -= 3.9 * mm
        yy -= 2.9 * mm

    return y - alto - 5 * mm


def caja_foley(c, y, titulo, izq, der):
    """Lista de foley en dos columnas, con casillas."""
    filas = max(len(izq), len(der))
    alto = 15 * mm + filas * 4.6 * mm

    c.setStrokeColor(TINTA)
    c.setLineWidth(1.1)
    c.rect(M, y - alto, CW, alto, stroke=1, fill=0)
    c.setFillColor(TINTA)
    c.rect(M, y - 7 * mm, CW, 7 * mm, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8.6)
    c.drawString(M + 4 * mm, y - 5 * mm, titulo.upper())
    yy = y - 12.5 * mm
    col = [M + 4 * mm, M + CW / 2 + 2 * mm]
    for i in range(filas):
        for j, lista in enumerate((izq, der)):
            if i < len(lista):
                txt = lista[i]
                destacado = txt.startswith("*")
                txt = txt.lstrip("*")
                casilla(c, col[j], yy - 0.8 * mm, 7)
                c.setFillColor(ACENTO if destacado else TINTA)
                c.setFont("Helvetica-Bold" if destacado else "Helvetica", 8.4)
                c.drawString(col[j] + 10, yy, txt)
        yy -= 4.6 * mm

    return y - alto - 5 * mm


PISO = 14 * mm   # por debajo de aqui empieza el pie de pagina


def pie(c, texto, y_final=None, pagina=""):
    """
    Pie de pagina, y de paso el chequeo de que el contenido no se salio.

    Sin esto es facil no darse cuenta: reportlab dibuja felizmente por
    debajo del borde del papel y el PDF se abre igual, solo que con texto
    cortado o encima del pie.
    """
    if y_final is not None and y_final < PISO:
        print(f"  AVISO: {pagina} se pasa {(PISO - y_final) / mm:.1f} mm por abajo")
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 7)
    c.drawString(M, 9 * mm, texto)
    c.drawRightString(W - M, 9 * mm, "LILUS  ·  hoja de rodaje")


# ─────────────────────────────────────────────────────────────
# Paginas
# ─────────────────────────────────────────────────────────────

def pagina_dia1(c):
    y = barra_titulo(c, H - M, "DIA 1  ·  HUMEDO", "elaboracion, crema y demostraciones   ·   ~8 h")
    y -= 5 * mm
    y = tira_ajustes(c, y)

    y = encabezado_seccion(c, y, "Horario")
    y = horario(c, y, [
        {"hora": "07:30", "texto": "MONTAJE", "dur": "30'",
         "notas": ["luces y tripode en las marcas  ·  bateria  ·  SSD  ·  audio  ·  grabar 30 s de silencio de sala"]},
        {"hora": "08:00", "n": "1", "texto": "Pesaje y polvos", "dur": "30'",
         "notas": ["balanza clavando el gramo  ·  cuchara entrando  ·  polvo cayendo  ·  cenital ordenado"]},
        {"hora": "08:30", "n": "2", "texto": "Derretido", "dur": "25'",
         "notas": ["cubos cayendo  ·  time-lapse  ·  remover  ·  termometro  ·  vapor a contraluz"]},
        {"hora": "08:55", "n": "3", "texto": "TANDA 1  ·  BARRA DE CAPAS", "dur": "80'", "pri": 3,
         "notas": ["de aqui salen OCHO videos, casi todo el dia 2  ·  las esperas se llenan con planos de banco",
                   "el dedo tocando la superficie es el plano clave"]},
        {"hora": "10:15", "n": "4", "texto": "TANDA 2  ·  EMBED", "dur": "25'",
         "notas": ["algo que valga la pena revelar al cortarlo manana"]},
        {"hora": "10:40", "texto": "Descanso  ·  revisar material 5 min  ·  cambiar bateria", "dur": "25'", "tipo": "pausa"},
        {"hora": "11:05", "n": "5", "texto": "TANDA 3  ·  BARRA SIMPLE", "dur": "20'",
         "notas": ["practica de corte, y es la que se deja sudando esta noche"]},
        {"hora": "11:25", "texto": "Almuerzo  ·  las tres tandas cuajan", "dur": "45'", "tipo": "pausa"},
        {"hora": "12:10", "n": "6", "texto": "CREMA  ·  mal a proposito", "dur": "50'", "aviso": True,
         "notas": ["guantes, mangas largas, cantidades chicas  ·  una jarra se pierde, esta presupuestado",
                   "el plano de la emulsion cortandose NO SE CORTA: un solo plano sostenido"]},
        {"hora": "13:00", "n": "7", "texto": "OLOR A HUEVO  (3 partes)", "dur": "45'", "pri": 2,
         "notas": ["rodar las tres partes juntas: misma luz, mismas manos, mismo tono"]},
        {"hora": "13:45", "n": "8", "texto": "G02  ·  el colageno", "dur": "25'",
         "notas": ["la tira de pH es una medicion REAL: si se nota trucada se cae todo el video"]},
        {"hora": "14:10", "texto": "Cambio de montaje  a  DEMOSTRACION", "dur": "15'", "tipo": "pausa"},
        {"hora": "14:25", "n": "9", "texto": "Las demostraciones", "dur": "45'",
         "notas": ["G03 en PLANO UNICO sin cortar  ·  3-4 tomas con vasos limpios cada vez",
                   "probarlo sin camara ANTES: si no se enturbia visiblemente, subir concentracion"]},
        {"hora": "15:10", "n": "10", "texto": "Banco de planos", "dur": "25'"},
        {"hora": "15:35", "texto": "Dejar una barra SUDANDO  +  montar el time-lapse", "dur": "10'",
         "notas": ["sin esto no hay video del jabon que suda"]},
        {"hora": "15:45", "texto": "LUCES OFF  ·  FOLEY", "dur": "40'"},
        {"hora": "16:25", "texto": "FIN DEL DIA 1", "tipo": "fin"},
    ])

    y = caja_planos(c, y, "Los 3 planos que no se pueden perder hoy", [
        ("LA LUZ ATRAVESANDO el frasco de plastico y frenandose en el ambar",
         "Los dos desde el MISMO sitio, sin mover nada: asi el corte es una comparacion y no dos planos."),
        ("EL CRONOMETRO corriendo mientras se enjabona",
         "Es el argumento entero del video. Que se lea, que se vea correr, y que el agua se corte en los 20 s."),
        ("LAS DOS MANOS frotandose",
         "Cierra la parte 1 y abre la parte 2. Un solo archivo en los dos videos: eso hace que la serie sea serie."),
    ])

    pie(c, "El foley del dia esta en la ultima hoja.", y, "dia 1")
    c.showPage()


def pagina_dia2(c):
    y = barra_titulo(c, H - M, "DIA 2  ·  SECO", "corte y producto terminado   ·   ~6 h")
    y -= 5 * mm
    y = tira_ajustes(c, y)

    y = encabezado_seccion(c, y, "Horario")
    y = horario(c, y, [
        {"hora": "08:30", "texto": "MONTAJE  ·  mesa de trabajo", "dur": "15'",
         "notas": ["hoy no se fabrica nada: se corta y se muestra lo de ayer  ·  la voz va aparte, otro dia"]},
        {"hora": "08:45", "n": "1", "texto": "EL RECETARIO", "dur": "40'", "pri": 3,
         "notas": ["que la receta no se lea completa en pantalla: planos cerrados y desenfoque parcial"]},
        {"hora": "09:25", "texto": "Cambio de montaje  a  RAYOS   (contraluz duro y rasante)", "dur": "20'", "tipo": "pausa"},
        {"hora": "09:45", "n": "2", "texto": "EL CORTE  +  bucle  +  variantes", "dur": "70'", "pri": 3,
         "notas": ["el bloque mas importante de los dos dias  ·  ensayar antes con la barra simple",
                   "sin mover nada: corte del embed  ·  multiple  ·  lento 60 fps  ·  fallido  ·  solo causticas"]},
        {"hora": "10:55", "n": "3", "texto": "Desmolde 60 fps y polvos", "dur": "30'"},
        {"hora": "11:25", "texto": "Almuerzo", "dur": "45'", "tipo": "pausa"},
        {"hora": "12:10", "texto": "Cambio de montaje  a  JOYA   (fondo negro, contraluz)", "dur": "20'", "tipo": "pausa"},
        {"hora": "12:30", "n": "4", "texto": "Producto terminado girando", "dur": "35'", "pri": 2},
        {"hora": "13:05", "n": "5", "texto": "El jabon que suda", "dur": "30'",
         "notas": ["las gotas SOLO se ven a contraluz  ·  la barra industrial sin logo visible"]},
        {"hora": "13:35", "n": "6", "texto": "Espuma y agua", "dur": "20'",
         "notas": ["con las sobras del corte"]},
        {"hora": "13:55", "n": "7", "texto": "Una palabra del diccionario", "dur": "25'",
         "notas": ["7 planos de apoyo de 15 s: emulsionante, tensioactivo, conservante, quelante, fase grasa, oclusivo"]},
        {"hora": "14:20", "n": "8", "texto": "Banco de planos", "dur": "20'"},
        {"hora": "14:40", "texto": "LUCES OFF  ·  FOLEY", "dur": "30'"},
        {"hora": "15:10", "texto": "FIN", "tipo": "fin"},
    ])

    y = caja_planos(c, y, "Los 3 planos que no se pueden perder hoy", [
        ("EL BOTON DEL RECETARIO sonando mientras las manos siguen trabajando",
         "Grabar ese audio DE VERDAD con el Maono, no ponerlo en la edicion. Que se oiga un poco lejos, con el eco del cuarto."),
        ("EL BUCLE DEL CORTE",
         "Camara fija y CINTA POR DEBAJO marcando donde va la barra. La segunda barra en la misma posicion exacta, misma entrada de cuchillo: ese es el final que empalma con el principio."),
        ("LA BARRA GIRANDO, montaje joya, 30 SEGUNDOS SEGUIDOS",
         "Los primeros 5 s abren el video de capas y los ultimos 5 lo cierran. Un archivo, dos usos."),
    ])

    pie(c, "El foley del dia esta en la ultima hoja.", y, "dia 2")
    c.showPage()


def pagina_referencia(c):
    y = barra_titulo(c, H - M, "REFERENCIA", "vale para los dos dias")
    y -= 8 * mm

    # ── Las 6 reglas ──
    y = encabezado_seccion(c, y, "Las 6 reglas del dia")
    reglas = [
        ("PALMADA al aire al empezar cada toma",
         "cinco segundos que te ahorran media hora de sincronizacion"),
        ("NO revisar material entre tomas",
         "se va el dia. Ruedas todo, revisas despues"),
        ("LIMPIAR entre toma y toma",
         "en macro una huella se ve como un crater. La mitad de las tomas que se pierden se pierden por suciedad, no por enfoque"),
        ("RODAR DE MAS",
         "de cada 5 tomas macro sirven 2. Es normal, no es que lo estes haciendo mal"),
        ("ANOTAR lo que salio mal",
         "un cuaderno al lado. La proxima tanda es mejor gracias a eso"),
        ("QUE NO SE LE VEA LA CARA",
         "ni un reflejo en el vidrio del molde. Revisarlo EN EL SET, no en la edicion: esa carta solo se juega una vez"),
    ]
    for i, (fuerte, detalle) in enumerate(reglas, 1):
        c.setFillColor(ACENTO)
        c.circle(M + 3 * mm, y + 1.1 * mm, 3.1 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(M + 3 * mm, y - 0.7 * mm, str(i))

        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(M + 9 * mm, y, fuerte)
        y -= 4.4 * mm
        c.setFillColor(GRIS)
        for ln in envolver(c, detalle, "Helvetica", 8.2, CW - 12 * mm):
            c.setFont("Helvetica", 8.2)
            c.drawString(M + 9 * mm, y, ln)
            y -= 4 * mm
        y -= 2.4 * mm

    y -= 3 * mm

    # ── Los 3 montajes de luz ──
    y = encabezado_seccion(c, y, "Los 3 montajes de luz")

    montajes = [
        ("MESA DE TRABAJO", "manos, proceso, voz",
         ["fondo claro", "luz grande y suave", "arriba, a 45 grados", "rebote blanco enfrente"]),
        ("RAYOS", "el corte",
         ["fondo oscuro", "luz DURA, sin difusor", "RASANTE y por detras", "cuarto lo mas oscuro posible", "> da las causticas"]),
        ("JOYA", "producto, gotas",
         ["fondo NEGRO MATE", "luz detras + difusor", "recorte arriba al 25%", "cartulina negra al lado", "> el jabon flota encendido"]),
    ]
    col_w = (CW - 8 * mm) / 3
    # El alto sale de la columna mas larga; con un alto fijo, la ultima linea
    # se montaba encima de la etiqueta de abajo.
    max_lineas = max(len(l) for _, _, l in montajes)
    alto_caja = 15 * mm + max_lineas * 5.4 * mm

    for i, (nombre, para, lineas) in enumerate(montajes):
        x = M + i * (col_w + 4 * mm)
        c.setStrokeColor(GRIS_CLARO)
        c.setLineWidth(0.9)
        c.rect(x, y - alto_caja, col_w, alto_caja, stroke=1, fill=0)

        # Cabecera: nombre del montaje y, a la derecha, para que sirve
        c.setFillColor(TINTA)
        c.rect(x, y - 9.6 * mm, col_w, 9.6 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.6)
        c.drawString(x + 3 * mm, y - 4.6 * mm, nombre)
        c.setFillColor(colors.HexColor("#c8b39a"))
        c.setFont("Helvetica", 7.4)
        c.drawString(x + 3 * mm, y - 8 * mm, para)

        yy = y - 14.4 * mm
        for ln in lineas:
            resalta = ln.startswith(">")
            c.setFillColor(ACENTO if resalta else TINTA)
            c.setFont("Helvetica-BoldOblique" if resalta else "Helvetica", 8.4)
            c.drawString(x + 3 * mm, yy, ln.lstrip("> "))
            yy -= 5.4 * mm

    y -= alto_caja + 5 * mm

    c.setFillColor(ALERTA)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(M, y, "El jabon transparente NO se ilumina de frente. Si pones las luces adelante se ve como plastico opaco.")
    y -= 9 * mm

    # ── Si te atrasas ──
    y = encabezado_seccion(c, y, "Si te atrasas  (se va a atrasar)")

    mitad = CW / 2 - 3 * mm
    c.setFillColor(GRIS_FONDO)
    c.rect(M, y - 27 * mm, mitad, 27 * mm, stroke=0, fill=1)
    c.setFillColor(GRIS)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M + 3 * mm, y - 5 * mm, "SE SACRIFICA EN ESTE ORDEN")
    c.setFont("Helvetica", 8.4)
    for i, t in enumerate(["1.  demostraciones opcionales", "2.  banco de planos",
                           "3.  espuma (dia 2, bloque 6)", "4.  variantes de corte"]):
        c.setFillColor(TINTA)
        c.drawString(M + 3 * mm, y - 10.6 * mm - i * 4.6 * mm, t)

    x2 = M + mitad + 6 * mm
    c.setFillColor(colors.HexColor("#fbf0ec"))
    c.rect(x2, y - 27 * mm, mitad, 27 * mm, stroke=0, fill=1)
    c.setStrokeColor(ALERTA)
    c.setLineWidth(1.2)
    c.rect(x2, y - 27 * mm, mitad, 27 * mm, stroke=1, fill=0)
    c.setFillColor(ALERTA)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x2 + 3 * mm, y - 5 * mm, "NUNCA")
    c.setFont("Helvetica-Bold", 8.4)
    for i, t in enumerate(["luz atravesando los frascos", "boton del recetario  ·  bucle del corte",
                           "la barra de capas", "el foley del quiebre"]):
        c.setFillColor(TINTA)
        c.drawString(x2 + 3 * mm, y - 10.6 * mm - i * 4.6 * mm, t)

    pie(c, "El detalle completo esta en LILUS-AUDIOVISUAL/06-plan-de-rodaje/dos-dias.md", y - 27 * mm, "referencia")
    c.showPage()


def pagina_foley(c):
    """
    Hoja propia porque la sesion de foley es su propio momento: luces
    apagadas, camara apagada y casa en silencio. No se consulta a la vez
    que el horario del dia.
    """
    y = barra_titulo(c, H - M, "FOLEY", "luces apagadas  ·  camara apagada  ·  casa en silencio")
    y -= 8 * mm

    # Ajustes de grabacion
    alto = 17 * mm
    c.setFillColor(GRIS_FONDO)
    c.rect(M, y - alto, CW, alto, stroke=0, fill=1)
    c.setStrokeColor(GRIS_CLARO)
    c.setLineWidth(0.7)
    c.rect(M, y - alto, CW, alto, stroke=1, fill=0)
    c.setFillColor(ACENTO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M + 4 * mm, y - 5.4 * mm, "COMO SE GRABA")
    c.setFillColor(TINTA)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(M + 4 * mm, y - 10.6 * mm,
                 "Microfono a 5-15 cm   ·   48 kHz / 24 bit   ·   nivel promedio -18 dB, picos que no pasen de -6")
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 8)
    c.drawString(M + 4 * mm, y - 14.8 * mm,
                 "Nevera desenchufada si se escucha  ·  celulares en avion  ·  cada sonido en 3 o 4 versiones  ·  y grabar 30 s de sala vacia")
    y -= alto + 7 * mm

    c.setFillColor(ALERTA)
    c.setFont("Helvetica-Bold", 9.4)
    c.drawString(M, y, "Si tu grabadora hace 96 kHz, usalo.")
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 9)
    c.drawString(M + 57 * mm, y,
                 "Despues le bajas medio tono en la edicion y suena mucho mas grave, sin romperse.")
    y -= 9 * mm

    y = caja_foley(c, y, "Dia 1  ·  liquidos y polvos", [
        "verter en molde, chorro fino",
        "verter en molde, chorro grueso",
        "remover con espatula",
        "burbujas subiendo",
        "gota cayendo",
        "batidora",
    ], [
        "cuchara entrando en el polvo",
        "polvo cayendo",
        "tamizar",
        "frasco abriendose y cerrandose",
        "vidrio sobre madera",
        "*ambiente de cuarto  (30 s)",
    ])

    y -= 2 * mm
    y = caja_foley(c, y, "Dia 2  ·  solidos, corte y agua", [
        "cuchillo entrando, lento",
        "cuchillo entrando, rapido",
        "*EL QUIEBRE   (4 o 5 versiones)",
        "rebanada cayendo en la mesa",
        "rebanada cayendo sobre otra",
        "desmoldar, el pop",
    ], [
        "barra golpeando la mesa",
        "dos barras frotandose",
        "una rascando con la una",
        "envolver en papel",
        "jabon bajo el chorro",
        "frotar entre las manos, espuma",
    ])

    y -= 2 * mm
    c.setFillColor(colors.HexColor("#fbf7f1"))
    c.rect(M, y - 20 * mm, CW, 20 * mm, stroke=0, fill=1)
    c.setStrokeColor(ACENTO)
    c.setLineWidth(1.3)
    c.rect(M, y - 20 * mm, CW, 20 * mm, stroke=1, fill=0)
    c.setFillColor(ACENTO)
    c.setFont("Helvetica-Bold", 8.6)
    c.drawString(M + 4 * mm, y - 6 * mm, "EL QUIEBRE ES EL SONIDO MAS IMPORTANTE DE TODO EL PROYECTO")
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 8.6)
    c.drawString(M + 4 * mm, y - 11.4 * mm,
                 "Es el climax del video de corte. Grabalo cuatro o cinco veces y elige despues.")
    c.drawString(M + 4 * mm, y - 16 * mm,
                 "En la mezcla va exagerado: el ASMR que funciona suena mas fuerte que la vida real.")

    pie(c, "El detalle esta en LILUS-AUDIOVISUAL/03-produccion/sonido-asmr.md", y - 20 * mm, "foley")
    c.showPage()


def main(salida):
    c = canvas.Canvas(salida, pagesize=A4)
    c.setTitle("LILUS - Hoja de rodaje - 2 dias")
    c.setAuthor("LILUS")
    c.setSubject("Plan de rodaje de dos dias para el contenido audiovisual de LILUS")
    pagina_dia1(c)
    pagina_dia2(c)
    pagina_referencia(c)
    pagina_foley(c)
    c.save()
    print("PDF generado:", salida)


if __name__ == "__main__":
    import sys
    main(sys.argv[1])
