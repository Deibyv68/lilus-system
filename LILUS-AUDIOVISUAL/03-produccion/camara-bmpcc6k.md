# BMPCC 6K para contenido de jabón

## Lo primero: te falta una pieza, y es barata

El Sigma f/1.8 (asumo el **18-35 mm Art**, que es el que casi todo el mundo
monta en esta cámara) **enfoca a 28 cm como mínimo**. Eso está bien para un
plano de manos trabajando, y está lejísimos de lo que este contenido necesita.

Los planos que hacen que este tipo de video funcione son los de **detalle
extremo**: la burbuja subiendo dentro de la glicerina, el filo del cuchillo
entrando en la barra, el grano de café suspendido, la gota corriendo por el
molde. A 28 cm nada de eso se ve.

**Es el agujero más grande de tu equipo y se tapa con entre 25 y 70 dólares.**

### Opciones, de más barata a mejor

| | Qué es | Precio | Veredicto |
|---|---|---|---|
| **Tubos de extensión EF** | Anillos huecos entre lente y cámara | $25-60 | **Empieza acá.** Compra los que tienen contactos electrónicos, si no pierdes el control del diafragma |
| **Raynox DCR-250** | Lente de aproximación que se enrosca adelante | ~$70 | La mejor relación calidad/precio. Óptica muy buena, se pone y se quita en dos segundos |
| **Macro real** (Laowa 65 mm f/2.8 2x, Canon EF 100 mm f/2.8) | Lente dedicado | $300-500 | Cuando el contenido ya esté funcionando |

**Mi recomendación:** tubos de extensión ahora mismo para empezar, y el Raynox
en cuanto puedas. Con las tres luces que tienes, la pérdida de luz de los tubos
no es problema.

Dos cosas que te van a pasar y conviene saber de antes:

- **Se pierde el infinito.** Con tubos puestos solo enfocas de cerca. Es normal.
  Se ponen para la tanda de planos macro y se quitan.
- **La profundidad de campo se vuelve milimétrica.** A f/1.8 con tubos vas a
  tener medio milímetro enfocado. **Cierra a f/5.6 u f/8** para macro. Sí,
  compraste un f/1.8 y te digo que lo cierres — en macro el f/1.8 es
  inutilizable, y para eso están las luces.

---

## Ajustes de la cámara

### Los que no se tocan

| Ajuste | Valor | Por qué |
|---|---|---|
| **ISO** | **400** | La cámara tiene doble ISO nativo en 400 y 3200. Con luces, 400 es el más limpio que vas a conseguir |
| **Obturador** | **180°** | Movimiento natural |
| **Balance de blancos** | **Fijo, medido** | Nunca automático. Si cambia a mitad de un plano, el color del jabón salta |
| **Códec** | **BRAW Q5** o **8:1** | Sobra para esto y ocupa la mitad. No grabes 3:1: llenas discos sin ganar nada visible |

### Resolución: el truco que más te va a servir

**Graba en 6K horizontal (6144×3456) aunque el video final sea vertical.**

Un recorte 9:16 dentro de esos 6K te da **1944×3456 píxeles** — casi el doble
de lo que necesita un video vertical de 1080×1920. O sea que puedes:

- Reencuadrar en la edición sin perder calidad
- Sacar un plano general y un plano cerrado **del mismo archivo**
- Hacer un "movimiento de cámara" falso moviendo el recorte, sin haber movido la
  cámara
- Exportar el mismo material en vertical para redes y en horizontal para YouTube

Es la diferencia entre grabar un plano y grabar tres.

### Cuadros por segundo

- **24 o 25 fps** para todo lo normal.
- **60 fps** solo para lo que va a ir en cámara lenta: verter, la gota que cae,
  el vapor. A 24 fps eso da 2.5× de lentitud.
- **Nunca grabes ASMR a 60 fps pensando en usar ese audio.** Al ralentizar el
  video el audio se descarta. El sonido va aparte de todas formas — está
  explicado en [sonido-asmr.md](sonido-asmr.md).

---

## Los cuatro problemas conocidos de esta cámara

### 1. La batería se muere

Una NP-F570 te da unos **45 minutos**. Un día de rodaje se va a la basura
esperando cargas.

**Solución:** dos o tres **NP-F970** (las grandes, tres veces la capacidad), o
mejor todavía, como grabas siempre en el mismo set, un **adaptador de corriente
o batería falsa**. Es un set fijo en tu casa — enchúfala y olvídate.

Esto no es un detalle. Es la causa número uno de que un día de rodaje planeado
para 12 videos termine con 4.

### 2. Las tarjetas CFast son carísimas

**No compres CFast.** Esta cámara **graba a un SSD externo por USB-C**. Un SSD
NVMe en una caja USB-C cuesta una fracción y va más rápido. Cualquier SSD que
sostenga 200 MB/s te sirve de sobra para BRAW Q5.

### 3. Obturador rodante (rolling shutter)

El sensor de 6K tiene un rolling shutter notorio. Un movimiento lateral rápido
te deja las verticales inclinadas, como gelatina.

**Para tu contenido casi no importa** —todo va sobre trípode y lento— pero si
alguna vez quieres un movimiento rápido, hazlo despacio y acelera en la edición.

### 4. El ventilador hace ruido

La cámara tiene ventilación activa. **Nunca es tu fuente de audio.** El sonido
se graba aparte, siempre.

---

## Enfoque manual: la parte difícil

Esta cámara no tiene autofoco usable, y en macro el enfoque es **el** problema.
Medio milímetro de diferencia y el plano se perdió.

Lo que funciona:

1. **Enfoque asistido (focus peaking) siempre encendido.**
2. **No enfoques girando el anillo.** En macro, fija el enfoque y **mueve la
   cámara o el objeto** hasta que el borde marcado caiga donde quieres. Es más
   preciso y es como se hace en macro de verdad.
3. **Trípode con cremallera o rieles.** Si el trípode no permite adelantar y
   atrasar la cámara con precisión, todo esto se vuelve un suplicio. Un riel
   macro barato cuesta $30 y te ahorra horas.
4. **Graba de más.** En macro, de cada 5 tomas sirven 2. Es normal, no es que lo
   estés haciendo mal.

---

## Checklist antes de empezar a rodar

```
[ ] Batería: falsa enchufada, o dos NP-F970 cargadas
[ ] SSD conectado y con espacio (calcula ~80 GB por día de rodaje)
[ ] ISO 400 · obturador 180° · balance de blancos medido y FIJO
[ ] BRAW Q5 · 6K horizontal
[ ] Focus peaking encendido
[ ] Grabadora de audio APARTE, encendida y probada
[ ] Claqueta: una palmada al aire al empezar cada toma para sincronizar
[ ] Trapo y alcohol al lado (la glicerina salpica y se ve en cada plano)
[ ] Guantes sin pelusa si van a salir manos
```

Lo del **trapo** parece una tontería y no lo es: en macro, una huella o una gota
seca en el molde se ve como un cráter. La mitad de las tomas que se pierden en
este tipo de contenido se pierden por suciedad, no por enfoque.
