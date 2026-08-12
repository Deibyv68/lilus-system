# LILUS AUDIOVISUAL

Todo lo del contenido para redes. **No toca nada del sistema**: son documentos,
no código. Se puede borrar entera y la app sigue funcionando igual.

---

## Punto de partida

| | |
|---|---|
| **Cara** | Nadie aparece, por ahora. Solo manos. La cara se guarda como carta para después. |
| **Voz** | La mamá narra. Es el centro de la marca aunque no se le vea. |
| **Alcance** | Abierto al mundo. Se vende solo en Ecuador, pero los videos no se cierran a Ecuador. |
| **Redes** | Desde cero, cuentas nuevas. |
| **Equipo** | BMPCC 6K · Sigma f/1.8 · 3 luces · lavalier Maono |

---

## Por dónde empezar a leer

Si vas a leer una sola cosa, que sea **[el-angulo.md](01-estrategia/el-angulo.md)**.
Ahí está la decisión de la que cuelga todo lo demás, y también la advertencia
más importante de toda esta carpeta: por qué perseguir vistas de ASMR puede
dejarte con cien mil seguidores que nunca van a comprar un jabón.

Después, en este orden:

1. **[01-estrategia/](01-estrategia/)** — qué grabar y por qué
2. **[03-produccion/](03-produccion/)** — cómo grabarlo (acá está lo que le falta a tu equipo)
3. **[02-guiones/](02-guiones/)** — los guiones listos para rodar
4. **[05-claims/](05-claims/)** — lo que no se puede decir sin meterse en problemas

## Y cuando vayas a rodar

En este orden:

1. **[que-se-fabrica.md](06-plan-de-rodaje/que-se-fabrica.md)** — cuántos jabones
   y cuántas cremas salen, con cantidades y moldes
2. **[tu-set.md](03-produccion/tu-set.md)** — tu espacio real: tus tres luces,
   tu azulejo, tus cartulinas y qué hay que mover
3. **[antes-de-rodar.md](06-plan-de-rodaje/antes-de-rodar.md)** — léelo con una
   semana de anticipación, hay dos compras que son bloqueantes
4. **[dos-dias.md](06-plan-de-rodaje/dos-dias.md)** — el mapa general de los dos
   días
5. **[dia-1-plano-a-plano.md](06-plan-de-rodaje/dia-1-plano-a-plano.md)** y
   **[dia-2-plano-a-plano.md](06-plan-de-rodaje/dia-2-plano-a-plano.md)** — el
   detalle: qué se ve, dónde va la cámara, qué hacen las manos, cuánto rodar
6. **[hoja-de-rodaje.pdf](06-plan-de-rodaje/hoja-de-rodaje.pdf)** — 4 hojas A4
   para imprimir y pegar en la pared

Si alguna palabra no se entiende:
**[vocabulario.md](03-produccion/vocabulario.md)**.

---

## Las tres cosas que más te van a servir

**Te falta una pieza barata en el equipo.** El Sigma no enfoca lo bastante
cerca para los planos de detalle que este contenido necesita. Está en
[camara-bmpcc6k.md](03-produccion/camara-bmpcc6k.md) con las opciones y los
precios. Son entre 25 y 70 dólares y cambia todo lo que puedes grabar.

**El jabón transparente no se ilumina de frente.** Se ilumina por detrás. Si
pones las tres luces adelante vas a tener imágenes planas y opacas de un
material que es precioso. Está en
[iluminacion-jabon-transparente.md](03-produccion/iluminacion-jabon-transparente.md).

**El ASMR de verdad casi nunca es sonido directo.** Se graba aparte. Nadie
consigue audio limpio con tres luces zumbando y el ventilador de la cámara
girando. Está en [sonido-asmr.md](03-produccion/sonido-asmr.md), y ahí también
está por qué el lavalier Maono es el micrófono equivocado para ASMR y el
correcto para la voz de tu mamá.

---

## Estructura

```
LILUS-AUDIOVISUAL/
├── 01-estrategia/
│   ├── el-angulo.md                    Qué hace distinta a LILUS
│   ├── sistema-de-contenido.md         Los carriles, el ritmo, las primeras 12 semanas
│   └── tendencias-2026.md              Qué está pasando ahora, con fuentes
├── 02-guiones/
│   ├── README.md                       Cómo leer un guion de estos
│   ├── S01-olor-a-huevo-1.md           ─┐
│   ├── S01-olor-a-huevo-2.md            ├ Serie: la investigación
│   ├── S01-olor-a-huevo-3.md           ─┘
│   ├── G02-colageno-que-no-sirve.md
│   ├── G03-dos-que-se-anulan.md
│   ├── G04-corte-en-silencio.md
│   ├── G05-capas.md
│   ├── G06-por-que-suda.md
│   ├── G07-el-recetario.md
│   ├── G08-mal-a-proposito.md
│   └── banco-de-ideas.md               40 ideas más, en una línea cada una
├── 03-produccion/
│   ├── tu-set.md                       ← tu espacio real, con tu foto
│   ├── vocabulario.md                  ← qué quiere decir cada palabra
│   ├── camara-bmpcc6k.md
│   ├── iluminacion-jabon-transparente.md
│   ├── sonido-asmr.md
│   ├── voz-de-tu-mama.md
│   └── set-fijo-y-tandas.md            Cómo grabar 12 videos en un día
├── 04-postproduccion/
│   └── flujo-resolve.md
├── 05-claims/
│   └── lo-que-no-se-puede-decir.md
└── 06-plan-de-rodaje/
    ├── que-se-fabrica.md               Cuántos jabones y cremas salen
    ├── dos-dias.md                     El mapa general, hora por hora
    ├── dia-1-plano-a-plano.md          ← el detalle de cada plano
    ├── dia-2-plano-a-plano.md          ←
    ├── antes-de-rodar.md               Compras y preparación previa
    ├── hoja-de-rodaje.pdf              ← para imprimir (4 hojas A4)
    ├── hoja-de-rodaje.md               La misma hoja, en texto
    └── generar-pdf.py                  Regenera el PDF si cambia el plan
```
