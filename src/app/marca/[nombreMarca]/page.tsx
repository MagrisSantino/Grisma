"use client";

import { isRolAdmin } from "@/lib/auth-roles";
import { FONDO_POR_MARCA } from "@/lib/brand-fondos";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function labelFromEmail(email: string) {
  if (!email) return "";
  const i = email.indexOf("@");
  return i > 0 ? email.slice(0, i) : email;
}

function initialsFromEmail(email: string) {
  const base = labelFromEmail(email) || email;
  const alnum = base.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/g, "");
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  if (alnum.length === 1) return (alnum + alnum).toUpperCase();
  return "??";
}

type Planilla = {
  id: string;
  title: string;
  image: string;
};

type CatalogSection = {
  id: string;
  title: string;
  planillas: Planilla[];
};

type BrandData = {
  slug: string;
  name: string;
  logoUrl: string;
  heroImage: string;
  sections: CatalogSection[];
};

type EditableBrand = BrandData & { heroSubtitle: string };

type ImagePickerTarget =
  | { kind: "hero" }
  | { kind: "planilla"; sectionId: string; planillaId: string };

const LOGO_POR_MARCA: Record<string, string> = {
  reebok: "/logos/Reebok_red_logo.svg",
  kappa: "/logos/Kappa_logo.svg",
  crocs: "/logos/Crocs_wordmark.svg",
  columbia: "/logos/Columbia_Sportswear_Co_logo.svg",
};

const MOCK_BRANDS: Record<string, BrandData> = {
  crocs: {
    slug: "crocs",
    name: "Crocs",
    logoUrl: "/logos/Crocs_wordmark.svg",
    heroImage: FONDO_POR_MARCA.crocs,
    sections: [
      {
        id: "promociones",
        title: "Promociones Vigentes",
        planillas: [
          {
            id: "p1",
            title: "Stock Classic Colors",
            image:
              "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
          },
          {
            id: "p2",
            title: "Outlet Verano 40%",
            image:
              "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1200&auto=format&fit=crop",
          },
          {
            id: "p3",
            title: "Pack Familiar",
            image:
              "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop",
          },
          {
            id: "p4",
            title: "Jibbitz & Accesorios",
            image:
              "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200&auto=format&fit=crop",
          },
        ],
      },
      {
        id: "invierno",
        title: "Temporada Invierno",
        planillas: [
          {
            id: "w1",
            title: "Línea Lined & Warm",
            image:
              "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop",
          },
          {
            id: "w2",
            title: "Boots All Terrain",
            image:
              "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop",
          },
          {
            id: "w3",
            title: "Clogs Resistentes al frío",
            image:
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
          },
        ],
      },
    ],
  },
};

function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getBrandData(rawSlug: string | undefined): EditableBrand {
  const key = (rawSlug ?? "crocs").toLowerCase();
  const base = MOCK_BRANDS[key]
    ? MOCK_BRANDS[key]
    : {
        ...MOCK_BRANDS.crocs,
        slug: key,
        name: slugToLabel(key),
      };
  const merged: BrandData = {
    ...base,
    heroImage: FONDO_POR_MARCA[key] ?? base.heroImage,
    logoUrl: LOGO_POR_MARCA[key] ?? base.logoUrl,
  };
  return { ...merged, heroSubtitle: "Catálogo B2B" };
}

function deepCloneBrand(b: EditableBrand): EditableBrand {
  return {
    ...b,
    sections: b.sections.map((s) => ({
      ...s,
      planillas: s.planillas.map((p) => ({ ...p })),
    })),
  };
}

function openPlanillaViewer(listName: string) {
  alert(`Abriendo visor de planilla para: ${listName}`);
}

let planillaIdSeq = 0;
function newPlanillaId() {
  planillaIdSeq += 1;
  return `new-${Date.now()}-${planillaIdSeq}`;
}

const editableOutline =
  "rounded-md outline-none ring-1 ring-dashed ring-white/40 focus:ring-2 focus:ring-white/60 dark:ring-white/35";

const editableOutlineSection =
  "rounded-md outline-none ring-1 ring-dashed ring-neutral-400/50 focus:ring-2 focus:ring-neutral-400 dark:ring-neutral-500/45 dark:focus:ring-neutral-400";

export default function MarcaPage() {
  const params = useParams();
  const router = useRouter();
  const nombreMarca = params.nombreMarca;
  const slug =
    typeof nombreMarca === "string"
      ? nombreMarca
      : Array.isArray(nombreMarca)
        ? nombreMarca[0]
        : "crocs";

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const initial = useMemo(() => getBrandData(slug), [slug]);
  const [data, setData] = useState<EditableBrand>(() =>
    deepCloneBrand(initial)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(deepCloneBrand(initial));
    setIsEditing(false);
  }, [initial]);

  const revokeIfBlob = useCallback((url: string) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;
  useEffect(() => {
    return () => {
      const d = dataRef.current;
      revokeIfBlob(d.heroImage);
      d.sections.forEach((s) =>
        s.planillas.forEach((p) => revokeIfBlob(p.image))
      );
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const email = session.user.email ?? "";
      setUserEmail(email);

      const { data: cliente, error } = await supabase
        .from("clientes")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (!cancelled && !error && isRolAdmin(cliente?.rol)) {
        setIsAdmin(true);
      }

      if (!cancelled) setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail("");
    setIsAdmin(false);
    setIsEditing(false);
    router.replace("/login");
    router.refresh();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pickerTarget;
    setPickerTarget(null);
    if (!file || !file.type.startsWith("image/") || !target) return;

    const url = URL.createObjectURL(file);

    if (target.kind === "hero") {
      setData((d) => {
        revokeIfBlob(d.heroImage);
        return { ...d, heroImage: url };
      });
      return;
    }

    setData((d) => ({
      ...d,
      sections: d.sections.map((s) => {
        if (s.id !== target.sectionId) return s;
        return {
          ...s,
          planillas: s.planillas.map((p) => {
            if (p.id !== target.planillaId) return p;
            revokeIfBlob(p.image);
            return { ...p, image: url };
          }),
        };
      }),
    }));
  };

  const removePlanilla = (sectionId: string, planillaId: string) => {
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              planillas: s.planillas.filter((p) => {
                if (p.id === planillaId) {
                  revokeIfBlob(p.image);
                  return false;
                }
                return true;
              }),
            }
      ),
    }));
  };

  const addPlanilla = (sectionId: string) => {
    const placeholder =
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop";
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              planillas: [
                ...s.planillas,
                {
                  id: newPlanillaId(),
                  title: "Nueva planilla",
                  image: placeholder,
                },
              ],
            }
      ),
    }));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    const t = title.trim();
    if (!t) return;
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, title: t } : s
      ),
    }));
  };

  const updatePlanillaTitle = (
    sectionId: string,
    planillaId: string,
    title: string
  ) => {
    const t = title.trim();
    if (!t) return;
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              planillas: s.planillas.map((p) =>
                p.id === planillaId ? { ...p, title: t } : p
              ),
            }
      ),
    }));
  };

  const toggleEditMode = () => {
    setIsEditing((v) => !v);
  };

  const imgUnoptimized = (src: string) => src.startsWith("blob:");

  const themeIcon = isDark ? "solar:sun-linear" : "solar:moon-linear";

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="text-sm">Cargando…</p>
      </div>
    );
  }

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

      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-500">
        <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl transition-colors duration-500">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-neutral-900 dark:bg-white transition-colors duration-500">
                <span className="text-xs font-semibold tracking-tighter text-white dark:text-neutral-900">
                  G
                </span>
              </div>
              <span className="text-lg font-semibold tracking-tighter text-neutral-900 dark:text-white transition-colors duration-500">
                GRISMA
              </span>
            </Link>

            <div className="flex items-center gap-5">
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 transition-colors duration-500 dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {initialsFromEmail(userEmail)}
                  </span>
                </div>
                <span className="max-w-[200px] truncate text-sm font-medium text-neutral-700 transition-colors duration-500 dark:text-neutral-300">
                  {labelFromEmail(userEmail) || userEmail || "—"}
                </span>
              </div>

              <div className="hidden h-4 w-px bg-neutral-300 dark:bg-neutral-800 sm:block" />

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                className="group flex items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                title="Cambiar tema"
                aria-label="Cambiar tema"
              >
                <iconify-icon
                  icon={themeIcon}
                  width="20"
                  height="20"
                  strokeWidth="1.5"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </button>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="group flex items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <iconify-icon
                  icon="solar:logout-2-linear"
                  width="20"
                  height="20"
                  strokeWidth="1.5"
                  className="transition-transform duration-300 group-hover:-translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </header>

        <div className="relative w-full">
          <div
            className="relative min-h-[min(52vh,520px)] w-full overflow-hidden"
            style={{ isolation: "isolate" }}
          >
            <Image
              src={data.heroImage}
              alt=""
              fill
              priority
              unoptimized={imgUnoptimized(data.heroImage)}
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/55 dark:bg-black/65" />

            {isEditing && (
              <button
                type="button"
                onClick={() => setPickerTarget({ kind: "hero" })}
                className="absolute inset-0 z-5 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/45 text-white backdrop-blur-[2px] transition hover:bg-black/55"
              >
                <iconify-icon
                  icon="solar:gallery-edit-linear"
                  width="32"
                  height="32"
                  strokeWidth="1.5"
                  className="opacity-95"
                />
                <span className="text-sm font-medium tracking-wide">
                  Cambiar Imagen
                </span>
              </button>
            )}

            <div className="absolute left-0 top-0 z-20 w-full px-4 pt-5 sm:px-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <iconify-icon
                  icon="solar:arrow-left-linear"
                  width="18"
                  height="18"
                  strokeWidth="1.5"
                  className="shrink-0"
                />
                Volver
              </Link>
            </div>

            <div className="relative z-10 flex min-h-[min(52vh,520px)] flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
              <div className="mb-2 max-w-xs drop-shadow-2xl sm:max-w-md md:max-w-lg">
                <img
                  src={data.logoUrl}
                  alt={data.name}
                  className="mx-auto block h-auto w-auto max-w-[min(280px,85vw)] object-contain object-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.65)] sm:max-w-[min(340px,80vw)] md:max-w-[min(400px,75vw)]"
                />
              </div>
              {isEditing ? (
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    setData((d) => ({
                      ...d,
                      heroSubtitle:
                        e.currentTarget.textContent?.trim() ||
                        d.heroSubtitle,
                    }))
                  }
                  className={`mt-4 px-2 py-1 text-sm font-medium uppercase tracking-[0.2em] text-white/90 ${editableOutline}`}
                >
                  {data.heroSubtitle}
                </p>
              ) : (
                <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                  {data.heroSubtitle}
                </p>
              )}
              {isEditing ? (
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    setData((d) => ({
                      ...d,
                      name: e.currentTarget.textContent?.trim() || d.name,
                    }))
                  }
                  className={`mt-2 px-2 py-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl ${editableOutline}`}
                >
                  {data.name}
                </h1>
              ) : (
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {data.name}
                </h1>
              )}
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
          {data.sections.map((section) => (
            <section key={section.id} className="mb-14 last:mb-0">
              <div className="mb-6 flex items-end justify-between gap-4">
                {isEditing ? (
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateSectionTitle(
                        section.id,
                        e.currentTarget.textContent ?? ""
                      )
                    }
                    className={`text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl ${editableOutlineSection} px-1 py-0.5`}
                  >
                    {section.title}
                  </h2>
                ) : (
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                    {section.title}
                  </h2>
                )}
                <span className="hidden text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sm:inline">
                  Desliza
                </span>
              </div>

              <div
                className={[
                  "flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pl-0.5 pt-1",
                  "scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]",
                  "[&::-webkit-scrollbar]:hidden",
                ].join(" ")}
              >
                {section.planillas.map((p) => (
                  <div
                    key={p.id}
                    className="group relative w-[min(280px,78vw)] shrink-0"
                  >
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removePlanilla(section.id, p.id)}
                        className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-600 bg-neutral-950/85 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-red-950/90 hover:border-red-500/60"
                        aria-label="Eliminar planilla"
                      >
                        ×
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        !isEditing && openPlanillaViewer(p.title)
                      }
                      className="relative w-full cursor-pointer overflow-hidden rounded-2xl border border-neutral-200/80 bg-white text-left shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-white/10 dark:hover:border-neutral-600 dark:focus-visible:outline-white disabled:translate-y-0 disabled:shadow-sm"
                      disabled={isEditing}
                    >
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          unoptimized={imgUnoptimized(p.image)}
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          sizes="280px"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-80 transition group-hover:opacity-90" />
                        {isEditing && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setPickerTarget({
                                kind: "planilla",
                                sectionId: section.id,
                                planillaId: p.id,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                setPickerTarget({
                                  kind: "planilla",
                                  sectionId: section.id,
                                  planillaId: p.id,
                                });
                              }
                            }}
                            className="absolute inset-0 z-5 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/45 text-white backdrop-blur-[2px] transition hover:bg-black/55"
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
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                          <iconify-icon
                            icon="vscode-icons:file-type-excel"
                            width="22"
                            height="22"
                            className="shrink-0"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updatePlanillaTitle(
                                  section.id,
                                  p.id,
                                  e.currentTarget.textContent ?? ""
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className={`text-sm font-semibold leading-snug text-neutral-900 dark:text-white ${editableOutlineSection} px-1 py-0.5`}
                            >
                              {p.title}
                            </p>
                          ) : (
                            <p className="text-sm font-semibold leading-snug text-neutral-900 dark:text-white">
                              {p.title}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Planilla de stock · clic para abrir
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => addPlanilla(section.id)}
                    className="flex w-[min(200px,70vw)] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-400/60 bg-neutral-100/50 px-4 py-8 text-sm font-medium text-neutral-600 transition hover:border-neutral-500 hover:bg-neutral-200/60 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/60"
                  >
                    <span className="text-2xl leading-none text-neutral-500 dark:text-neutral-400">
                      +
                    </span>
                    Agregar nueva planilla
                  </button>
                )}
              </div>
            </section>
          ))}
        </main>

        {isAdmin && (
          <button
            type="button"
            onClick={toggleEditMode}
            title={isEditing ? "Guardar cambios" : "Activar modo edición"}
            aria-label={
              isEditing ? "Guardar cambios y salir del modo edición" : "Activar modo edición"
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
