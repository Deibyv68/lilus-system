# Postproducción en DaVinci Resolve

## Antes que nada: ya tienes la licencia

La BMPCC 6K **viene con una licencia de DaVinci Resolve Studio** (la versión de
pago, ~$300). Está en una tarjeta dentro de la caja de la cámara, o en el menú de
la cámara.

Si no la activaste, actívala. Resolve Studio te da reducción de ruido temporal,
más aceleración por GPU y algunas herramientas de audio que la versión gratis no
tiene.

Y Resolve es además **el editor nativo de BRAW**: abre los archivos sin
convertir, con todos los controles de la toma editables después.

---

## El flujo, en orden

### 1. Proyecto

- Timeline: **1080×1920 (vertical)**, 24 o 25 fps
- Trabajar con el material 6K adentro de un timeline vertical **es lo normal**:
  te da el margen de reencuadre que se explica en
  [camara-bmpcc6k.md](../03-produccion/camara-bmpcc6k.md)

### 2. Sincronizar el audio

El audio bueno se grabó aparte. Para juntarlo:

- Si grabaste la **palmada** al inicio de cada toma: en la página Edit,
  seleccionar clip de video + clip de audio → clic derecho → **Auto Align Clips →
  Based on Waveform**. Resolve los alinea solo usando el pico de la palmada.
- Después, **silenciar la pista de audio de la cámara**. Solo servía de guía.

### 3. Reencuadrar de 6K a vertical

En **Inspector → Transform**:

- **Zoom** hasta que el encuadre vertical quede como quieres
- **Position X/Y** para elegir qué parte del 6K se ve
- Se pueden poner **keyframes** en Position para hacer un movimiento de cámara
  que nunca existió — un travelling lento sobre una toma fija se ve muy bien y
  cuesta cero

> Con 6K horizontal tienes 1944×3456 de recorte vertical disponible. Puedes
> ampliar hasta ~1.8× antes de bajar de 1080 de ancho. Aprovéchalo sin miedo.

### 4. Color

En la página **Color**:

1. **Camera Raw** → el clip BRAW se puede reinterpretar completo. Cambiar el
   balance de blancos acá **no tiene pérdida**, a diferencia de corregirlo
   después. Si te equivocaste de kelvin en el set, se arregla aquí y queda
   perfecto.
2. **Color Space Transform**:
   - Input: `Blackmagic Design Film Gen 5` / `Blackmagic Design Wide Gamut Gen 5`
   - Output: `Rec.709` / `Gamma 2.4`
   - Es más limpio que aplicar una LUT genérica
3. Recién ahí: contraste, saturación y el resto

**Para jabón transparente:** cuidar de no quemar los altos. La luz que atraviesa
el jabón vive en la parte alta de la imagen y si se recorta, se pierde
exactamente lo que hace bonito el material. Mira el **waveform** y deja los picos
por debajo de 100.

**Un consejo de aspecto:** no satures de más. La tentación con jabones de colores
es subir la saturación al máximo y se ve barato. Con contraluz bien hecho, el
color ya está ahí.

### 5. Audio (Fairlight)

Orden de pistas:

```
A1   VOZ            → normalizar a -16 LUFS, EQ suave, compresión ligera
A2   FOLEY          → los sonidos del proceso
A3   AMBIENTE       → colchón de cuarto al 5%
A4   (música)       → normalmente vacía
```

**En la voz:**
- **Voice Isolation** (solo en Studio) para limpiar ruido de fondo. Con
  moderación: pasado de rosca suena a robot
- EQ: cortar todo por debajo de 80 Hz (ruido de manejo, golpes)
- Compresor suave para que no se vaya el nivel entre frases

**Mezcla final: -14 LUFS integrado.** Las plataformas normalizan a esa zona;
subir más solo aplasta el sonido.

### 6. Subtítulos quemados

**Esto no es opcional.** Los subtítulos automáticos de las plataformas no cuentan
— hay que quemarlos en el video.

En Resolve:
1. Página Edit → menú **Timeline → Create Subtitles from Audio** (Studio)
2. Revisar **uno por uno**. La transcripción automática se equivoca con nombres
   de ingredientes y con acento ecuatoriano
3. Estilo: tipografía gruesa, borde o sombra, **en el tercio inferior pero no
   abajo del todo** — las plataformas tapan la parte inferior con la interfaz

**Zona segura:** deja el 12% de arriba y el 20% de abajo libres de texto
importante.

### 7. Exportar

| | |
|---|---|
| Formato | MP4 |
| Códec | H.264 (o H.265 si el destino lo acepta) |
| Resolución | 1080×1920 |
| Bitrate | 12-20 Mbps |
| Audio | AAC 320 kbps |

**Exportar una sola vez y subir el mismo archivo a las tres plataformas.**

> ⚠️ **Nunca descargues un video de TikTok para subirlo a Instagram.** Lleva
> marca de agua y las plataformas penalizan el contenido con marca de otra red.
> Siempre desde el editor.

---

## Ahorros de tiempo que valen la pena

**Guarda un proyecto plantilla** con:
- Timeline vertical ya configurado
- El nodo de Color Space Transform listo
- El estilo de subtítulo ya definido
- Las pistas de audio nombradas

Duplicar esa plantilla para cada video te ahorra veinte minutos cada vez.

**Usa Power Grades.** Cuando llegues a un color que te guste para el montaje
"joya", guárdalo como Power Grade. La próxima tanda arranca desde ahí.

**Edita en tandas también.** Igual que se rueda de a muchos, se edita de a
muchos: un día de edición con el mismo proyecto abierto rinde mucho más que seis
sesiones sueltas.

---

## Si Resolve va lento

Es probable con material 6K:

- **Optimized Media**: Playback → Generate Optimized Media. Trabaja con proxies y
  al exportar vuelve al original
- Bajar la resolución de reproducción a **1/2 o 1/4** (Playback → Timeline Proxy
  Mode). No afecta la exportación
- Trabajar desde el **SSD**, no desde un disco mecánico
