# LILUS — Sistema de gestión de ventas

Aplicación web para gestionar el catálogo de jabones artesanales LILUS, registrar
pedidos recibidos por cualquier canal (WhatsApp, Instagram, manual…), calcular
envíos y generar las etiquetas imprimibles (envío 4×6 + etiqueta 2×1 con fecha
de caducidad + las etiquetas PDF propias de cada producto).

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Tailwind CSS v4 + shadcn/ui** para la interfaz
- **Prisma 6 + SQLite** como base de datos
- **pdf-lib + bwip-js** para generar PDFs e impresión de código de barras
- **Zod** para validación

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- npm
- Una impresora térmica configurada en Windows (la MUNBYN RW403B se empareja por
  Bluetooth y aparece como "Impresora" del sistema)

## Instalación (primera vez)

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

El seed crea:

- Zonas: `Quito` (default) y `Fuera de Quito`
- Transportadora: `Servientrega` con tarifas $3.50 (Quito) y $5.50 (resto)
- Datos del remitente por defecto

## Correr en desarrollo

```bash
npm run dev
```

Abre <http://localhost:3000>.

## Scripts

| Comando            | Descripción                                                   |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo                                        |
| `npm run build`    | Compila para producción                                       |
| `npm start`        | Sirve la build                                                |
| `npm run db:migrate` | Crea/aplica una nueva migración Prisma                      |
| `npm run db:reset` | **Borra** la base, vuelve a migrar y siembra                  |
| `npm run db:seed`  | Re-ejecuta el seed                                            |
| `npm run db:studio`| Abre Prisma Studio (UI gráfica de la base)                    |

## Estructura

```
prisma/
  schema.prisma        # modelos de la BD
  seed.ts              # datos iniciales (zonas, transportadora, settings)
src/
  app/
    (app)/             # layout con sidebar
      page.tsx         # dashboard
      productos/       # CRUD productos individuales
      packs/           # CRUD packs (grupos de productos)
      pedidos/         # listado, creación y detalle de pedidos
      clientes/        # listado de clientes (se crean al registrar pedidos)
      envios/          # zonas, transportadoras y tarifas
      configuracion/   # remitente, prefijo de orden, marca
    api/
      orders/[id]/
        shipping-label/  # GET — PDF 4×6 etiqueta de envío
        expiry-labels/   # GET — PDF 2×1 (uno por unidad física)
        product-labels/  # GET — combina los PDFs subidos de cada producto
  lib/
    prisma.ts          # cliente singleton
    schemas.ts         # validadores Zod
    pdf-shipping-label.ts
    pdf-expiry-label.ts
    barcode.ts         # bwip-js code128
    uploads.ts         # guardado de imágenes y PDFs en /public/uploads
    order-utils.ts     # numeración y cálculo de caducidad
public/
  uploads/             # imágenes de productos/packs y PDFs de etiquetas (gitignored)
```

## Flujo principal

1. **Configurar el remitente** en `Configuración` (nombre y dirección que sale
   en la etiqueta de envío).
2. **Cargar productos** en `Productos > Nuevo`. Para cada producto:
   - SKU, precio, costo de producción, vida útil (meses), imagen
   - Sube el PDF de la etiqueta diseñada para ese producto
3. **Crear packs** en `Packs > Nuevo` agrupando productos existentes.
4. **Confirmar tarifas de envío** en `Envíos`.
5. **Registrar un pedido** en `Nuevo pedido`:
   - Buscar productos/packs y agregarlos al carrito
   - Llenar datos de cliente y dirección
   - Seleccionar zona y transportadora → el envío se calcula solo
   - Crear pedido
6. **Imprimir desde la página del pedido**:
   - Etiqueta de envío 4×6
   - Etiquetas de producto (PDFs combinados, uno por unidad)
   - Etiquetas 2×1 con lote + fecha de caducidad (una por unidad física)

Cada botón abre el PDF en una nueva pestaña. Usa **Ctrl+P** y selecciona la
impresora MUNBYN.

## Impresión con la MUNBYN RW403B

Por ahora se imprime con el diálogo nativo de Windows:

1. Empareja la impresora por Bluetooth desde *Configuración → Dispositivos →
   Impresoras y escáneres*.
2. Instala el driver MUNBYN (viene en el CD o descárgalo desde la web del
   fabricante).
3. En el diálogo de impresión del PDF:
   - **Tamaño de papel**: selecciona `4 × 6 in` para la etiqueta de envío, o
     `2 × 1 in` para la etiqueta de caducidad.
   - **Márgenes**: `Ninguno`
   - **Escala**: `Tamaño real` (sin ajuste)

Más adelante se integrará impresión directa Bluetooth desde la app (planificado
pero no incluido en esta versión).

## Backup de la base de datos

La base es un único archivo SQLite en `prisma/dev.db`. Para respaldar, basta
copiarlo:

```powershell
Copy-Item prisma\dev.db "backups\dev-$(Get-Date -Format yyyyMMdd-HHmm).db"
```

## Despliegue en internet

Como respondiste, esta app va a vivir en internet. Opciones recomendadas:

- **VPS sencillo** (Railway, Fly.io, Render): el archivo SQLite vive en el
  servidor. Configura un *volume* persistente para `prisma/dev.db` y
  `public/uploads/`.
- **Turso** (SQLite distribuido): si quieres mayor disponibilidad, migra la
  conexión a Turso ajustando `DATABASE_URL` y el adapter.

Variables de entorno necesarias:

```env
DATABASE_URL="file:./prisma/dev.db"
```

## Pendiente / próximos pasos

- Login con usuario único (por ahora la app está abierta)
- Variantes de producto (la tabla existe, falta UI)
- Impresión directa por Bluetooth a la MUNBYN sin intervención del navegador
- Importación desde Excel para arrancar con el catálogo
- Reportes de ventas por rango de fechas
