/**
 * Recetario, diccionario e inventario.
 *
 * Las tres se leen de pie frente a la mesa de trabajo, casi siempre en la
 * tablet y a un brazo de distancia. La clase enciende el modo lectura
 * (ver `.modo-lectura` en globals.css), que en pantallas de tablet agranda
 * todo en proporción. En teléfono y en escritorio no cambia nada.
 *
 * Para sumar otra sección alcanza con moverla dentro de (lectura). El
 * paréntesis hace que la carpeta no aparezca en la URL.
 */
export default function LecturaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="modo-lectura">{children}</div>;
}
