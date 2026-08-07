# Multiusuario, roles y reinicio de avance

Ya está **aplicado en tu Supabase** (`30_multiusuario.sql`). Este documento explica el modelo
y cómo conectarlo desde `auth.js` / `login.js`.

## El modelo en una frase

Hay **dos credenciales distintas** y no se mezclan:

| | Qué es | Dónde vive | Para qué sirve |
|---|---|---|---|
| **Login de la plataforma** | tu usuario + tu contraseña | `usuarios` con `tipo = 'PERSONA'` | Dice **quién eres** y tu rol. De aquí sale el dueño del avance. |
| **Clave SOL del aplicativo** | RUC + `SIST` + `NORTON` | `usuarios` con `tipo = 'CLAVE_SOL'` | Dice **con qué empresa** trabajas. Es igual para todos. |

El avance se guarda siempre por la pareja **(usuario_id, ruc)**. Si Juan trabaja la ferretería
y la botica, son dos avances; y el de Juan nunca toca el de María aunque usen el mismo RUC.

La data base (los 4,181 comprobantes, el T-Registro, la PLAME) es **compartida y de solo
lectura**. Lo que el alumno emite, anula o modifica va a `movimientos_usuario`, que es suyo.
Por eso "reiniciar" es simplemente borrar sus filas: la base vuelve sola a su estado original.

## Tablas nuevas

| Tabla | Qué guarda |
|---|---|
| `secciones` | Aula del docente: nombre, curso, ciclo y `codigo_matricula` de 6 caracteres |
| `matriculas` | Qué estudiante está en qué sección (`ACTIVA` / `RETIRADA`) |
| `avance_usuario` | Estado por `(usuario_id, ruc, modulo)` en JSON — reemplaza al `localStorage` |
| `declaraciones` | Cada FV 621 / FV 710 / PLAME presentada, con sus datos y puntaje |
| `movimientos_usuario` | Comprobantes que el alumno emite o anula, altas y ceses de trabajadores |
| `reinicios` | Bitácora: quién reinició a quién, cuándo y cuántas filas borró |

En `usuarios` se agregaron `tipo`, `creado_por` y `ultimo_acceso`. El rol legado `USUARIO`
pasó a `ESTUDIANTE` y los registros nuevos nacen como `INVITADO`.

## Permisos de reinicio

| Rol | A quién puede reiniciar |
|---|---|
| MASTER | a cualquiera |
| DOCENTE | a sí mismo y a los estudiantes matriculados en sus secciones |
| PRO | solo a sí mismo |
| ESTUDIANTE / ASISTENTE / PRUEBA / INVITADO | a nadie |

La regla vive en la base de datos (`fn_puede_reiniciar`), no en el navegador, así que no se
puede saltar desde la consola del cliente.

## Funciones que puedes llamar con `supabase.rpc()`

```js
// Guardar el avance de un módulo (reemplaza el localStorage)
await supabase.rpc('fn_guardar_avance', {
  p_usuario: usuarioActual().id,   // id de la tabla usuarios
  p_ruc:     rucEmpresaActiva,
  p_modulo:  'sire',               // 'rvie' | 'rce' | 'plame' | 'tregistro' | 'declaraciones'
  p_estado:  { paso: 3, borrador: {...} }
});

// Leer el avance al entrar
const { data } = await supabase
  .from('avance_usuario')
  .select('modulo, estado')
  .eq('usuario_id', usuarioActual().id)
  .eq('ruc', rucEmpresaActiva);

// Reiniciar: todas las empresas del usuario, o solo una
await supabase.rpc('fn_reiniciar_avance', {
  p_actor:    usuarioActual().id,
  p_objetivo: idDelAlumno,          // el propio id si es PRO reiniciándose
  p_ruc:      null,                 // o '20601458722' para una sola empresa
  p_motivo:   'Fin de la práctica 3'
});
// devuelve { avance_usuario: 4, declaraciones: 2, movimientos: 0, ruc: "TODAS" }

// Reiniciar a toda una sección de golpe
await supabase.rpc('fn_reiniciar_seccion', { p_actor: docenteId, p_seccion: 1, p_ruc: null });

// Gestión de alumnos (DOCENTE)
await supabase.rpc('fn_crear_seccion',     { p_docente: id, p_nombre: 'Grupo A', p_curso: 'Tributación II', p_ciclo: '2026-I' });
await supabase.rpc('fn_matricular',        { p_docente: id, p_seccion: 1, p_usuario: 'jperez' });
await supabase.rpc('fn_retirar_matricula', { p_docente: id, p_seccion: 1, p_usuario: 'jperez' });
```

Si el rol no alcanza, la función lanza error `42501` y `supabase.rpc` devuelve `error`.
Muestra `error.message` tal cual: ya viene explicado en español.

## Vistas listas para las pantallas

- `v_mis_estudiantes` — la lista del docente: `select * from v_mis_estudiantes where docente_id = ?`
- `v_avance_resumen` — cuánto lleva cada usuario en cada una de las 10 empresas
- `v_calificacion_fv621` — compara lo declarado contra `resumen_fv621` y devuelve `correcto` true/false

## Qué falta cambiar en tu código

1. **Guardar el `id`** del usuario en la sesión al hacer login, no solo el nombre. Hoy
   `auth.js` guarda `usuarioActual().ruc`; necesita también `id`.
2. **Cambiar el namespace del localStorage**: hoy es `sim_<ruc>_<clave>`; debe ser
   `sim_<usuario_id>_<ruc>_<clave>` para que dos usuarios en la misma PC no se pisen.
3. **Reemplazar `sire_estado`** por `avance_usuario` en las funciones de guardar y restaurar.
   La tabla vieja quedó intacta; al final de `30_multiusuario.sql` hay un `insert` comentado
   para migrar lo que ya tenías, asignándoselo a un usuario concreto.
4. **Permitir el ingreso a más roles**: hoy `auth.js` solo deja entrar a `PRUEBA`. Debe
   aceptar `ESTUDIANTE`, `ASISTENTE`, `PRO`, `DOCENTE`, `PRUEBA` y `MASTER`.
5. **Pantalla del docente** con la lista de `v_mis_estudiantes`, el código de matrícula y los
   botones de matricular, retirar y reiniciar.

## Pruebas que ya se corrieron

Se crearon un docente, dos alumnos (uno de otra clase), un PRO y una sección de prueba, y se
verificó cada regla. Los 12 casos pasaron y los datos de prueba se borraron después:

- El avance quedó separado por usuario y por empresa
- El docente reinició a su alumno **solo en una empresa** y el avance de la otra se conservó
- El alumno de otra clase no se vio afectado
- Docente con alumno ajeno → bloqueado · PRO reiniciando a otro → bloqueado ·
  Estudiante reiniciándose → bloqueado · MASTER a cualquiera → permitido
- Tras retirar la matrícula, el docente dejó de poder reiniciar a ese alumno

## Pendiente de seguridad

Con la clave anon (que está en `auth.js`, visible en el navegador) y RLS desactivado,
cualquiera podría escribir directo en `avance_usuario` de otro usuario saltándose la interfaz.
Las funciones protegen el reinicio, pero no la escritura directa. Cuando quieras cerrarlo del
todo hay que migrar el login a Supabase Auth y activar RLS con políticas
`usuario_id = auth.uid()`. El modelo ya está diseñado para eso: solo habría que cambiar el tipo
de la columna dueña.
