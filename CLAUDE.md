# TAXLAB 360 — Simulador SUNAT (contexto del proyecto)

Laboratorio contable para enseñanza: réplica de los aplicativos de SUNAT (SIRE, FV 621,
FV 710, PLAME, T-Registro, SEE SOL) con data ficticia de 10 empresas.
Sitio en producción: `laboratorio-tributario.vercel.app`. Frontend estático (HTML + JS
plano, sin framework ni build) y Supabase como backend.

## Supabase

Proyecto `klmjmlhwuzhymrplemgw`. La clave anon está en `auth.js` (es pública por diseño).
Hay un MCP de Supabase configurado en `.mcp.json`.

**Ojo:** en la misma base conviven tablas de otros proyectos del autor (`docentes`,
`horarios_ptp`, `eventos`, `encuestas`, `participantes`, `stg_*`, `cot_horarios`...).
No son del simulador y siguen abiertas a escritura desde anon — no tocarlas sin preguntar.

### Tablas del simulador

| Grupo | Tablas |
|---|---|
| Data base (solo lectura) | `registro_ventas` (4 181), `registro_compras` (4 553), `ventas_adicional/detalle/cuotas`, `compras_adicional/detalle/cuotas`, `t_registro` (115), `plame_detalle` (1 936), `plame_resumen`, `conceptos_plame`, `catalogo_productos`, `catalogo_compras`, `resumen_fv621` (190), `resumen_fv710`, `parametros_tributarios`, `empresas_simulador` (10), `empresas` |
| Identidad y permisos | `usuarios`, `roles_permisos` (7 roles), `modulos` (15) |
| Avance del alumno | `avance_usuario`, `declaraciones`, `movimientos_usuario` |
| Aula | `secciones`, `matriculas`, `reinicios` |

`registro_ventas` y `registro_compras` usan los nombres de columna del layout SIRE, con
tildes y espacios (`"BI Gravada"`, `"Fecha de emisión"`, `"Ruc"` es **bigint**). Las tablas
nuevas usan snake_case y `ruc` es **text**.

`resumen_fv621` y `resumen_fv710` son la **respuesta esperada** de cada declaración: sirven
para calificar automáticamente lo que declara el alumno (ver `v_calificacion_fv621`).

## Modelo de acceso: dos puertas

1. **Plataforma** — usuario + contraseña propios (`fn_login`). Define quién eres y tu rol.
   Nada del sitio se abre sin esto.
2. **Clave SOL** — RUC + `SIST` + `NORTON` (`fn_login_clave_sol`). Solo elige con qué empresa
   se trabaja. El RUC se valida contra `empresas_simulador`.

El avance se guarda por la pareja **(usuario_id, RUC)**: mismo alumno en dos empresas son dos
avances, y el de un alumno nunca toca el de otro.

### Roles

`INVITADO` (solo Plan Contable, portal SOL y FV 621, solo RUC 20123456789, no guarda) ·
`PRUEBA` (todo, no guarda) · `ESTUDIANTE` / `ASISTENTE` (todo, guardan) ·
`PRO` (+ se reinicia a sí mismo) · `DOCENTE` (+ gestiona y reinicia a sus alumnos) ·
`MASTER` (sin restricciones).

La matriz está en la tabla `roles_permisos`: **cambiar una fila cambia el comportamiento sin
tocar código**. No hardcodear reglas de rol en el JS.

## Convenciones importantes

- **Toda la lógica de permisos vive en la base**, en funciones `fn_*` que son
  `SECURITY DEFINER` con `search_path = public, pg_temp`. El frontend solo pinta.
- `anon` **no puede escribir en ninguna tabla del simulador**: solo `select`. Cualquier
  escritura nueva debe hacerse creando una función `fn_*`, no un `insert` desde el cliente.
- La tabla `usuarios` no es legible desde el navegador. Para nombres usar
  `v_usuarios_publico`. Las contraseñas son bcrypt (`pgcrypto`); no existe el texto plano.
- Estado del alumno: usar `Sesion.guardarAvance()` / `SimStore`, nunca `localStorage` directo.
  El namespace es `sim_<usuario_id>_<ruc>_<clave>`.
- El SQL Editor de Supabase **rechaza queries de más de ~1 MB**: por eso los scripts de carga
  están partidos en trozos de 293 KB en `sql_supabase/`.

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `sesion.js` | API `Sesion` (login, Clave SOL, permisos, avance) + guard que bloquea enlaces y pinta carteles. Se carga en las 14 páginas, después de `auth.js`. |
| `auth.js` | Cliente Supabase, `SimStore` (persistencia del avance por usuario+RUC) y el modal de acceso. |
| `login.js` | Las dos puertas; con `?redirect=` es la Clave SOL. |
| `gestor.html` / `gestor.js` | Gestor de usuarios: secciones, matrícula, reinicio y (MASTER) cambio de rol. |
| `index.html` | Portada. Los botones se deshabilitan solos según el rol. |
| `rvie.js`, `rce.js` (~150 KB c/u) | Los simuladores del SIRE. |
| `fv710_importar.js` + `plantillas_710/` | Botón "Importar" del FV 710: plantillas SUNAT ACTIVO / PASIVO / EEGGPP (.xls) y detalle por tercero de las casillas 361-367 y 404-408 (`0710AAAArucCCC.TXT`). |
| `sql_supabase/` | 00–20 carga de data · 30 multiusuario · 35 roles · 40 acceso · 45 gestor · 50 seguridad |
| `LEEME_ROLES.md` | Documentación viva del modelo de acceso, con las pruebas ejecutadas. |
| `carga_csv/` | Los mismos datos en CSV, por si hay que recargar desde cero. |

## Estado y pendientes

Todo lo anterior está **aplicado y probado en la base de producción** (las pruebas se
corrieron como rol `anon`, con usuarios temporales que se borraron después).

Pendiente, en orden:

1. **Token de sesión.** Hoy las funciones reciben `p_usuario` / `p_actor` como parámetro, así
   que alguien podría llamar `fn_guardar_avance` con el id de un compañero y pisarle el
   avance. Solución sin migrar a Supabase Auth: tabla `sesiones` con token aleatorio que
   emita `fn_login`, y que las funciones resuelvan el usuario desde el token.
2. **Botón de restablecer contraseña** en el gestor (la función `fn_cambiar_clave` ya existe;
   falta la UI). Hace falta porque las contraseñas ya no se pueden consultar.
3. Conectar los simuladores (`rvie.js`, `rce.js`, `declaraciones.html`) a
   `movimientos_usuario` para que lo que el alumno emita o anule quede en su capa propia.
4. Migrar a Supabase Auth + RLS por `auth.uid()` solo si el sitio sale del aula.

## Idioma

Todo en español (código, comentarios, mensajes de error al usuario). Los mensajes que ve el
alumno deben explicar qué hacer, no solo qué falló.
