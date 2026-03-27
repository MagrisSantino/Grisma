/**
 * Rutas bajo `public/fondos/` (reebok.jpg, kappa.jpg, crocs.jpg, columbia.jpg).
 *
 * `next/image` cachea por URL. Si cambiás un archivo pero mantenés el nombre y no se
 * actualiza en el navegador, subí `FONDOS_REVISION` en 1 (o borrá `.next` y reiniciá el dev).
 */
export const FONDOS_REVISION = "2";

function fondo(file: string) {
  return `${file}?v=${FONDOS_REVISION}`;
}

export const FONDO_POR_MARCA: Record<string, string> = {
  reebok: fondo("/fondos/reebok.jpg"),
  kappa: fondo("/fondos/kappa.jpg"),
  crocs: fondo("/fondos/crocs.jpg"),
  columbia: fondo("/fondos/columbia.jpg"),
};
