# Plataforma SG-SST

Plataforma multiempresa para gestionar el Sistema de Gestión de Seguridad y Salud en el Trabajo (Colombia):
estándares mínimos, documentos y formatos, evidencias, indicadores y KPI, plan anual y acciones de mejora.

La plantilla base es el SG-SST de Hotel y E.D.S. La Troncal (estructura PHVA, listado de documentos e indicadores),
ajustada a la norma vigente. Cada empresa recibe una copia y la adapta a su tamaño, riesgo y actividad.

## Normas que implementa

- Decreto 1072 de 2015, libro 2, parte 2, título 4, capítulo 6 (SG-SST).
- Resolución 0312 de 2019: grupos de 7, 21 o 60 estándares, tabla de valores, valoración e indicadores mínimos.

## Estructura

| Carpeta | Contenido |
|---|---|
| `packages/core` | Reglas de negocio sin dependencias: catálogo de 60 ítems, aplicabilidad, calificación, indicadores, KPI y listado maestro de documentos. |
| `supabase/migrations` | Base de datos PostgreSQL con seguridad por empresa (RLS), almacenamiento de archivos y conservación de registros por 20 años. |
| `apps/web` | Plataforma web (pendiente). |
| `apps/movil` | App de campo (pendiente). |

## Comandos

```bash
pnpm install
pnpm test        # pruebas del núcleo
pnpm typecheck
```

## Pendiente de verificar

- Las listas de 7 y 21 estándares (`packages/core/src/aplicabilidad.ts`) se deben cotejar con el texto oficial
  de la Resolución 0312. La constante `LISTAS_REDUCIDAS_VERIFICADAS` lo indica.
