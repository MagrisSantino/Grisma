"use client";

import { FONDO_POR_MARCA } from "@/lib/brand-fondos";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type HomeBrand = {
  id: string;
  href: string;
  fondo: string;
  logo: string;
};

type DashboardPicker =
  | { kind: "fondo"; brandId: string }
  | { kind: "logo"; brandId: string };

const INITIAL_BRANDS: HomeBrand[] = [
  {
    id: "reebok",
    href: "/marca/reebok",
    fondo: FONDO_POR_MARCA.reebok,
    logo: "/logos/Reebok_red_logo.svg",
  },
  {
    id: "kappa",
    href: "/marca/kappa",
    fondo: FONDO_POR_MARCA.kappa,
    logo: "/logos/Kappa_logo.svg",
  },
  {
    id: "crocs",
    href: "/marca/crocs",
    fondo: FONDO_POR_MARCA.crocs,
    logo: "/logos/Crocs_wordmark.svg",
  },
  {
    id: "columbia",
    href: "/marca/columbia",
    fondo: FONDO_POR_MARCA.columbia,
    logo: "/logos/Columbia_Sportswear_Co_logo.svg",
  },
];

const editableHero =
  "rounded-lg outline-none ring-1 ring-dashed ring-neutral-400/60 focus:ring-2 focus:ring-neutral-500 dark:ring-neutral-500/50 dark:focus:ring-neutral-400";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [isAdmin] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [heroLine1, setHeroLine1] = useState("Bienvenido a tu");
  const [heroLine2, setHeroLine2] = useState("portal de pedidos");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Selecciona una marca para ver el stock en tiempo real, descubrir nuevas promociones y armar tu pedido mayorista."
  );

  const [brands, setBrands] = useState<HomeBrand[]>(() =>
    INITIAL_BRANDS.map((b) => ({ ...b }))
  );

  const [pickerTarget, setPickerTarget] = useState<DashboardPicker | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokeIfBlob = useCallback((url: string) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const brandsRef = useRef(brands);
  brandsRef.current = brands;
  useEffect(() => {
    return () => {
      brandsRef.current.forEach((b) => {
        revokeIfBlob(b.fondo);
        revokeIfBlob(b.logo);
      });
    };
  }, [revokeIfBlob]);

  useEffect(() => {
    if (pickerTarget && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, [pickerTarget]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pickerTarget;
    setPickerTarget(null);
    if (!file || !file.type.startsWith("image/") || !target) return;

    const url = URL.createObjectURL(file);

    if (target.kind === "fondo") {
      setBrands((prev) =>
        prev.map((b) => {
          if (b.id !== target.brandId) return b;
          revokeIfBlob(b.fondo);
          return { ...b, fondo: url };
        })
      );
      return;
    }

    setBrands((prev) =>
      prev.map((b) => {
        if (b.id !== target.brandId) return b;
        revokeIfBlob(b.logo);
        return { ...b, logo: url };
      })
    );
  };

  const themeIcon = isDark ? "solar:sun-linear" : "solar:moon-linear";
  const imgUnopt = (src: string) => src.startsWith("blob:");

  const cardBaseClass =
    "group relative block w-full aspect-4/3 sm:aspect-video rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 bg-neutral-900";

  return (
    <>
      <Script
        src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
        strategy="lazyOnload"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />

      <div className="antialiased bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-500 min-h-screen flex flex-col flex-1 w-full selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 pb-24">
        <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 bg-neutral-900 dark:bg-white rounded-sm flex items-center justify-center transition-colors duration-500">
                <span className="text-white dark:text-neutral-900 text-xs font-semibold tracking-tighter">
                  G
                </span>
              </div>
              <span className="text-lg font-semibold tracking-tighter text-neutral-900 dark:text-white transition-colors duration-500">
                GRISMA
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 transition-colors duration-500">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    LC
                  </span>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                  Local Centro
                </span>
              </div>

              <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 hidden sm:block transition-colors duration-500" />

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center justify-center group"
                title="Cambiar tema"
                aria-label="Cambiar tema"
              >
                <iconify-icon
                  icon={themeIcon}
                  width="20"
                  height="20"
                  strokeWidth="1.5"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              </button>

              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center justify-center group"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <iconify-icon
                  icon="solar:logout-2-linear"
                  width="20"
                  height="20"
                  strokeWidth="1.5"
                  className="group-hover:-translate-x-0.5 transition-transform duration-300"
                />
              </button>
            </div>
          </div>
        </header>

        <main className="grow flex flex-col items-center pt-20 pb-24 px-6 w-full max-w-7xl mx-auto">
          <section className="text-center mb-20 max-w-3xl">
            {isEditing ? (
              <>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter text-neutral-900 dark:text-white mb-6 transition-colors duration-500 leading-tight">
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      setHeroLine1(
                        e.currentTarget.textContent?.trim() || heroLine1
                      )
                    }
                    className={`inline-block px-1 ${editableHero}`}
                  >
                    {heroLine1}
                  </span>{" "}
                  <br className="hidden sm:block" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      setHeroLine2(
                        e.currentTarget.textContent?.trim() || heroLine2
                      )
                    }
                    className={`inline-block bg-linear-to-r from-neutral-900 to-neutral-500 bg-clip-text px-1 text-transparent dark:from-white dark:to-neutral-500 ${editableHero}`}
                  >
                    {heroLine2}
                  </span>
                </h1>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    setHeroSubtitle(
                      e.currentTarget.textContent?.trim() || heroSubtitle
                    )
                  }
                  className={`text-base sm:text-lg font-normal text-neutral-600 dark:text-neutral-400 transition-colors duration-500 max-w-xl mx-auto ${editableHero}`}
                >
                  {heroSubtitle}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter text-neutral-900 dark:text-white mb-6 transition-colors duration-500 leading-tight">
                  {heroLine1} <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500">
                    {heroLine2}
                  </span>
                </h1>
                <p className="text-base sm:text-lg font-normal text-neutral-600 dark:text-neutral-400 transition-colors duration-500 max-w-xl mx-auto">
                  {heroSubtitle}
                </p>
              </>
            )}
          </section>

          <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {brands.map((brand) => {
              const inner = (
                <>
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={brand.fondo}
                      alt=""
                      fill
                      priority
                      unoptimized={imgUnopt(brand.fondo)}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPickerTarget({ kind: "fondo", brandId: brand.id });
                      }}
                      className="absolute inset-0 z-8 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/30 text-white backdrop-blur-[1px] transition hover:bg-black/45"
                      aria-label="Cambiar imagen de fondo"
                    >
                      <iconify-icon
                        icon="solar:gallery-edit-linear"
                        width="28"
                        height="28"
                        strokeWidth="1.5"
                      />
                      <span className="text-xs font-medium">
                        Cambiar Imagen
                      </span>
                    </button>
                  )}
                  <div className="absolute inset-0 z-9 bg-linear-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-500 group-hover:opacity-90 pointer-events-none" />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 py-10 sm:p-8 transition-transform duration-500 ease-out group-hover:-translate-y-6 pointer-events-none">
                    <div className="pointer-events-auto relative inline-flex max-w-full items-center justify-center">
                      <img
                        src={brand.logo}
                        alt=""
                        className="mx-auto block h-auto max-h-16 w-auto max-w-[min(320px,92%)] object-contain object-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:max-h-[4.5rem] md:max-h-28"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPickerTarget({
                              kind: "logo",
                              brandId: brand.id,
                            });
                          }}
                          className="absolute -right-1 -top-1 z-20 flex h-9 min-w-[2.25rem] cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/30 bg-black/55 px-2 text-[10px] font-medium text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
                          aria-label="Cambiar logo"
                        >
                          <iconify-icon
                            icon="solar:gallery-edit-linear"
                            width="16"
                            height="16"
                            strokeWidth="1.5"
                          />
                          Logo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-8 flex justify-center opacity-0 translate-y-8 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none">
                    <span className="bg-white text-neutral-950 px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg">
                      Ver Stock y Hacer Pedido
                      <iconify-icon
                        icon="solar:arrow-right-linear"
                        width="18"
                        height="18"
                        strokeWidth="1.5"
                      />
                    </span>
                  </div>
                </>
              );

              const shellClass = `${cardBaseClass} ${
                isEditing ? "cursor-default" : "cursor-pointer"
              }`;

              return (
                <Link
                  key={brand.id}
                  href={brand.href}
                  scroll={false}
                  aria-label={
                    isEditing
                      ? `Editar tarjeta ${brand.id}`
                      : `Ir al catálogo ${brand.id}`
                  }
                  aria-disabled={isEditing}
                  onClick={(e) => {
                    if (isEditing) e.preventDefault();
                  }}
                  className={shellClass}
                >
                  {inner}
                </Link>
              );
            })}
          </section>
        </main>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            title={isEditing ? "Guardar cambios" : "Activar modo edición"}
            aria-label={
              isEditing
                ? "Guardar cambios y salir del modo edición"
                : "Activar modo edición"
            }
            className={[
              "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-2",
              isEditing
                ? "bg-emerald-600 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/40 hover:bg-emerald-500 focus-visible:outline-emerald-300"
                : "border border-neutral-700/80 bg-neutral-900/85 text-neutral-200 shadow-black/25 backdrop-blur-md hover:border-neutral-600 hover:bg-neutral-800/90 hover:text-white focus-visible:outline-neutral-400 dark:border-neutral-700 dark:bg-neutral-950/90",
            ].join(" ")}
          >
            <iconify-icon
              icon={isEditing ? "solar:diskette-linear" : "solar:pen-linear"}
              width="24"
              height="24"
              strokeWidth="1.5"
              className="shrink-0"
            />
          </button>
        )}
      </div>
    </>
  );
}
