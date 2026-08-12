# -*- coding: utf-8 -*-
"""
Guía de rodaje LILUS en formato teléfono.

La hoja de rodaje A4 sirve pegada en la pared; en un teléfono no, porque el
visor ajusta el ancho de la página a la pantalla y una letra de 9 pt sobre 210
mm de ancho queda en un milímetro real. Por eso esta versión usa una página
angosta (100 x 178 mm, la proporción de un teléfono) con letra grande: al
ajustarse al ancho de la pantalla, el texto queda del tamaño de una app.

Los diagramas de luz van dibujados, no en ASCII, porque el arte con caracteres
necesita un ancho que en esta página no existe.
"""
import io
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors

W, H = 100 * mm, 178 * mm
M = 7 * mm
CW = W - 2 * M
PISO = 12 * mm            # por debajo de esto, salta de pagina

TINTA = colors.HexColor("#1a1a1a")
GRIS = colors.HexColor("#666666")
GRIS_CLARO = colors.HexColor("#d5d5d5")
GRIS_FONDO = colors.HexColor("#f2f1ee")
ACENTO = colors.HexColor("#8a5a2b")
ALERTA = colors.HexColor("#a8321e")
VERDE = colors.HexColor("#2f6b4f")


class Doc:
    """Cursor que fluye y salta de página solo."""

    def __init__(self, c):
        self.c = c
        self.y = H - M
        self.pag = 1
        self.seccion = ""
        self.indice = {}

    # ── mecánica de página ──────────────────────────────────

    def espacio(self, alto):
        """Pide sitio; si no cabe, pasa de página."""
        if self.y - alto < PISO:
            self.nueva_pagina()

    def nueva_pagina(self):
        self.pie()
        self.c.showPage()
        self.pag += 1
        self.y = H - M

    def pie(self):
        c = self.c
        c.setStrokeColor(GRIS_CLARO)
        c.setLineWidth(0.6)
        c.line(M, 9 * mm, W - M, 9 * mm)
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 6.6)
        c.drawString(M, 5.6 * mm, self.seccion)
        c.drawRightString(W - M, 5.6 * mm, str(self.pag))

    # ── texto ───────────────────────────────────────────────

    def envolver(self, texto, fuente, tam, ancho):
        c = self.c
        lineas, actual = [], ""
        for p in texto.split():
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

    def parrafo(self, texto, tam=10.5, fuente="Helvetica", color=TINTA,
                x=None, ancho=None, interlinea=4.7):
        x = M if x is None else x
        ancho = CW if ancho is None else ancho
        for ln in self.envolver(texto, fuente, tam, ancho):
            self.espacio(interlinea * mm)
            self.c.setFillColor(color)
            self.c.setFont(fuente, tam)
            self.c.drawString(x, self.y, ln)
            self.y -= interlinea * mm
        self.y -= 1.4 * mm

    # ── titulares ───────────────────────────────────────────

    def portadilla(self, numero, titulo, bajada=""):
        """Página de entrada de sección."""
        if self.y < H - M:
            self.nueva_pagina()
        self.seccion = titulo
        self.indice[titulo] = self.pag
        c = self.c

        c.setFillColor(ACENTO)
        c.rect(M, self.y - 30 * mm, CW, 30 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(M + 5 * mm, self.y - 15 * mm, numero)
        c.setFont("Helvetica-Bold", 14)
        for i, ln in enumerate(self.envolver(titulo, "Helvetica-Bold", 14, CW - 28 * mm)):
            c.drawString(M + 22 * mm, self.y - 10 * mm - i * 6 * mm, ln)
        self.y -= 36 * mm

        if bajada:
            self.parrafo(bajada, tam=10, color=GRIS, fuente="Helvetica-Oblique")
            self.y -= 2 * mm

    def h2(self, texto):
        self.espacio(16 * mm)
        self.y -= 3 * mm
        c = self.c
        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 12.5)
        for ln in self.envolver(texto, "Helvetica-Bold", 12.5, CW):
            c.drawString(M, self.y, ln)
            self.y -= 5.6 * mm
        c.setStrokeColor(ACENTO)
        c.setLineWidth(1.4)
        c.line(M, self.y + 2.2 * mm, M + 14 * mm, self.y + 2.2 * mm)
        self.y -= 3.4 * mm

    def h3(self, texto):
        self.espacio(12 * mm)
        self.y -= 1.6 * mm
        self.c.setFillColor(ACENTO)
        self.c.setFont("Helvetica-Bold", 10.5)
        for ln in self.envolver(texto, "Helvetica-Bold", 10.5, CW):
            self.c.drawString(M, self.y, ln)
            self.y -= 4.9 * mm
        self.y -= 1 * mm

    # ── listas ──────────────────────────────────────────────

    def vinetas(self, items):
        for it in items:
            self.espacio(6 * mm)
            self.c.setFillColor(ACENTO)
            self.c.circle(M + 1.4 * mm, self.y + 1.3 * mm, 1.1, stroke=0, fill=1)
            self.parrafo(it, tam=10, x=M + 5 * mm, ancho=CW - 5 * mm, interlinea=4.5)
            self.y += 0.6 * mm

    def casillas(self, items):
        for it in items:
            fuerte = it.startswith("*")
            it = it.lstrip("*")
            self.espacio(6 * mm)
            self.c.setStrokeColor(GRIS)
            self.c.setLineWidth(0.8)
            self.c.rect(M, self.y - 0.4 * mm, 7, 7, stroke=1, fill=0)
            self.parrafo(it, tam=9.6,
                         fuente="Helvetica-Bold" if fuerte else "Helvetica",
                         color=ACENTO if fuerte else TINTA,
                         x=M + 10, ancho=CW - 10, interlinea=4.4)
            self.y += 0.8 * mm

    # ── cajas ───────────────────────────────────────────────

    def caja(self, texto, titulo="", color=ACENTO, fondo="#fbf7f1"):
        lineas = self.envolver(texto, "Helvetica", 9.6, CW - 10 * mm)
        alto = 6 * mm + len(lineas) * 4.4 * mm + (5 * mm if titulo else 0)
        self.espacio(alto + 3 * mm)

        c = self.c
        c.setFillColor(colors.HexColor(fondo))
        c.rect(M, self.y - alto + 3 * mm, CW, alto, stroke=0, fill=1)
        c.setFillColor(color)
        c.rect(M, self.y - alto + 3 * mm, 1.6 * mm, alto, stroke=0, fill=1)

        yy = self.y
        if titulo:
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 8.4)
            c.drawString(M + 5 * mm, yy, titulo.upper())
            yy -= 5 * mm
        c.setFillColor(TINTA)
        c.setFont("Helvetica", 9.6)
        for ln in lineas:
            c.drawString(M + 5 * mm, yy, ln)
            yy -= 4.4 * mm
        # El borde de abajo de la caja cae ~7.4 mm por debajo de la ultima
        # linea; hay que dejar el cursor por debajo de ESE borde, no de la
        # linea, o el siguiente titulo se monta encima del recuadro.
        self.y = yy - 7 * mm

    def alerta(self, texto, titulo="Ojo"):
        self.caja(texto, titulo, color=ALERTA, fondo="#fbeeea")

    def clave(self, texto, titulo="No se puede perder"):
        self.caja(texto, titulo, color=VERDE, fondo="#eef5f1")

    # ── tabla simple de dos columnas ────────────────────────

    def tabla(self, filas, ancho_izq=30 * mm):
        for i, (izq, der) in enumerate(filas):
            l_izq = self.envolver(izq, "Helvetica-Bold", 9.4, ancho_izq - 2 * mm)
            l_der = self.envolver(der, "Helvetica", 9.4, CW - ancho_izq)
            alto = max(len(l_izq), len(l_der)) * 4.4 * mm + 2.2 * mm
            self.espacio(alto)

            c = self.c
            if i % 2 == 0:
                c.setFillColor(GRIS_FONDO)
                c.rect(M, self.y - alto + 3.4 * mm, CW, alto, stroke=0, fill=1)

            yy = self.y
            c.setFillColor(ACENTO)
            c.setFont("Helvetica-Bold", 9.4)
            for ln in l_izq:
                c.drawString(M + 1.5 * mm, yy, ln)
                yy -= 4.4 * mm
            yy = self.y
            c.setFillColor(TINTA)
            c.setFont("Helvetica", 9.4)
            for ln in l_der:
                c.drawString(M + ancho_izq, yy, ln)
                yy -= 4.4 * mm
            self.y -= alto
        self.y -= 2 * mm

    # ── ficha de plano ──────────────────────────────────────

    def plano(self, codigo, titulo, campos, prioridad=0):
        """
        Una ficha por plano. Los campos son pares (etiqueta, texto) con las
        etiquetas cortas a la izquierda, que es lo que hace que se pueda
        escanear con el pulgar sin leerlo todo.
        """
        etiq_w = 15 * mm
        alto = 7 * mm
        preparados = []
        for et, tx in campos:
            lns = self.envolver(tx, "Helvetica", 9.2, CW - etiq_w - 2 * mm)
            preparados.append((et, lns))
            alto += len(lns) * 4.3 * mm
        l_tit = self.envolver(titulo, "Helvetica-Bold", 10.2, CW - 12 * mm)
        alto += len(l_tit) * 4.8 * mm
        self.espacio(alto + 4 * mm)

        c = self.c
        y0 = self.y
        c.setFillColor(colors.HexColor("#faf9f7"))
        c.rect(M, y0 - alto + 4 * mm, CW, alto, stroke=0, fill=1)
        c.setStrokeColor(GRIS_CLARO)
        c.setLineWidth(0.7)
        c.rect(M, y0 - alto + 4 * mm, CW, alto, stroke=1, fill=0)

        yy = y0 - 1.5 * mm
        c.setFillColor(ACENTO)
        c.setFont("Helvetica-Bold", 10.2)
        c.drawString(M + 2.5 * mm, yy, codigo)
        cursor = M + 2.5 * mm + c.stringWidth(codigo, "Helvetica-Bold", 10.2) + 2 * mm
        c.setFillColor(TINTA)
        for i, ln in enumerate(l_tit):
            c.drawString(cursor if i == 0 else M + 2.5 * mm, yy, ln)
            yy -= 4.8 * mm
        if prioridad:
            c.setFillColor(VERDE)
            for k in range(prioridad):
                c.circle(W - M - 4 * mm - k * 3.4 * mm, y0 - 1.2 * mm, 1.3, stroke=0, fill=1)

        yy -= 1.4 * mm
        for et, lns in preparados:
            c.setFillColor(GRIS)
            c.setFont("Helvetica-Bold", 7.4)
            c.drawString(M + 2.5 * mm, yy, et.upper())
            c.setFillColor(TINTA)
            c.setFont("Helvetica", 9.2)
            for ln in lns:
                c.drawString(M + etiq_w, yy, ln)
                yy -= 4.3 * mm
        self.y = y0 - alto


# ─────────────────────────────────────────────────────────────
# Diagramas de luz, dibujados
# ─────────────────────────────────────────────────────────────

def _luz(c, x, y, r=2.6 * mm, encendida=True):
    c.setFillColor(colors.HexColor("#f0c040") if encendida else GRIS_CLARO)
    c.setStrokeColor(TINTA if encendida else GRIS_CLARO)
    c.setLineWidth(0.7)
    c.circle(x, y, r, stroke=1, fill=1)
    if encendida:
        c.setStrokeColor(colors.HexColor("#e0a020"))
        c.setLineWidth(0.6)
        for ang in (-30, 0, 30):
            import math
            a = math.radians(ang)
            c.line(x + r * math.cos(a), y + r * math.sin(a),
                   x + (r + 2.4 * mm) * math.cos(a), y + (r + 2.4 * mm) * math.sin(a))


def _camara(c, x, y):
    c.setFillColor(TINTA)
    p = c.beginPath()
    p.moveTo(x - 3 * mm, y - 2 * mm)
    p.lineTo(x + 3 * mm, y - 2 * mm)
    p.lineTo(x + 1.6 * mm, y + 2 * mm)
    p.lineTo(x - 1.6 * mm, y + 2 * mm)
    p.close()
    c.drawPath(p, stroke=0, fill=1)


def _jabon(c, x, y):
    c.setFillColor(colors.HexColor("#bcd8e8"))
    c.setStrokeColor(TINTA)
    c.setLineWidth(0.8)
    c.roundRect(x - 3.4 * mm, y - 2.2 * mm, 6.8 * mm, 4.4 * mm, 1 * mm, stroke=1, fill=1)


def _cartulina(c, x1, y1, x2, y2, etiqueta="", color=TINTA):
    c.setStrokeColor(color)
    c.setLineWidth(2.6)
    c.line(x1, y1, x2, y2)
    if etiqueta:
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 6.2)
        c.drawCentredString((x1 + x2) / 2, min(y1, y2) - 3.4 * mm, etiqueta)


def diagrama(doc, tipo):
    """
    Vista desde arriba del montaje.

    Cada elemento tiene su franja horizontal reservada y las etiquetas viven
    en la franja de abajo del elemento que nombran. Con las etiquetas pegadas
    al costado de cada cosa terminaban encima de la mesa o de las luces.
    """
    c = doc.c
    cx = M + CW / 2
    hay_fondo = tipo in ("joya", "rayos")
    alto = (54 if hay_fondo else 48) * mm
    doc.espacio(alto + 3 * mm)
    y0 = doc.y

    c.setFillColor(colors.HexColor("#f7f7f5"))
    c.rect(M, y0 - alto, CW, alto, stroke=0, fill=1)
    c.setStrokeColor(GRIS_CLARO)
    c.setLineWidth(0.7)
    c.rect(M, y0 - alto, CW, alto, stroke=1, fill=0)

    def rotulo(x, y, texto, color=GRIS, tam=6.3):
        c.setFillColor(color)
        c.setFont("Helvetica", tam)
        c.drawCentredString(x, y, texto)

    # ── franjas ──
    if hay_fondo:
        y_fondo, y_fondo_txt = y0 - 5 * mm, y0 - 9 * mm
        y_luz, y_luz_txt = y0 - 16 * mm, y0 - 21.5 * mm
        y_top, y_bot = y0 - 26 * mm, y0 - 38 * mm
        y_cam, y_cam_txt, y_extra = y0 - 43 * mm, y0 - 47 * mm, y0 - 51 * mm
    else:
        y_luz, y_luz_txt = y0 - 10 * mm, y0 - 15.5 * mm
        y_top, y_bot = y0 - 20 * mm, y0 - 32 * mm
        y_cam, y_cam_txt, y_extra = y0 - 37 * mm, y0 - 41 * mm, y0 - 45 * mm
    media = (y_top + y_bot) / 2

    if hay_fondo:
        c.setStrokeColor(TINTA)
        c.setLineWidth(3)
        c.line(cx - 17 * mm, y_fondo, cx + 17 * mm, y_fondo)
        rotulo(cx, y_fondo_txt, "cartulina negra  (fondo)")

    # la mesa
    c.setStrokeColor(GRIS)
    c.setLineWidth(0.9)
    c.setFillColor(colors.white)
    c.rect(cx - 18 * mm, y_bot, 36 * mm, y_top - y_bot, stroke=1, fill=1)

    _camara(c, cx, y_cam)
    rotulo(cx, y_cam_txt, "camara")

    if tipo == "mesa":
        _luz(c, cx - 19 * mm, y_luz)
        rotulo(cx - 19 * mm, y_luz_txt, "principal + difusor")
        _luz(c, cx + 19 * mm, y_luz, encendida=False)
        rotulo(cx + 19 * mm, y_luz_txt, "apagada")
        _jabon(c, cx, media)
        c.setStrokeColor(colors.HexColor("#aaaaaa"))
        c.setLineWidth(2.6)
        c.line(cx + 14 * mm, media + 4 * mm, cx + 14 * mm, media - 4 * mm)
        rotulo(cx, y_extra, "a la derecha, cartulina BLANCA de rebote")

    elif tipo == "joya":
        _luz(c, cx - 10 * mm, y_luz)
        rotulo(cx - 10 * mm, y_luz_txt, "principal + difusor")
        _luz(c, cx + 14 * mm, y_luz, r=1.9 * mm)
        rotulo(cx + 14 * mm, y_luz_txt, "recorte, 25%")
        c.setStrokeColor(GRIS)
        c.setLineWidth(2)
        c.setDash(1.5, 1.5)
        c.line(cx - 17 * mm, y_top - 2.5 * mm, cx - 3 * mm, y_top - 2.5 * mm)
        c.setDash()
        _jabon(c, cx, media - 1 * mm)
        c.setStrokeColor(TINTA)
        c.setLineWidth(2.6)
        c.line(cx - 14 * mm, media - 4 * mm, cx - 14 * mm, media + 1 * mm)
        rotulo(cx, y_extra, "raya punteada = difusor   ·   raya negra = negativo")

    elif tipo == "rayos":
        _luz(c, cx, y_luz)
        rotulo(cx, y_luz_txt, "UNICA luz: dura, sin difusor, baja y rasante", ALERTA, 6.4)
        _jabon(c, cx, media + 1.5 * mm)
        c.setFillColor(colors.HexColor("#e0a020"))
        for dx in (-10, -5, 0, 5, 10):
            c.circle(cx + dx * mm, media - 4 * mm, 1.0, stroke=0, fill=1)
        rotulo(cx, y_extra, "los puntos son las causticas proyectadas")

    doc.y = y0 - alto - 3 * mm
