# Control de acceso por roles — TAXLAB 360

Aplicado en Supabase (`sql_supabase/30`, `35` y `40`) y en el frontend (`sesion.js`).

## Las dos puertas

**Puerta 1 — al entrar al sitio.** Nada se abre sin sesión. Cualquier botón de la portada
intercepta el clic y abre el acceso. Se pide **usuario y contraseña propios**; de ahí sale el
rol y el dueño del avance.

**Puerta 2 — dentro de ciertos aplicativos.** Se pide la **Clave SOL: RUC + SIST + NORTON**.
El RUC se valida contra `empresas_simulador` y además se comprueba que el rol tenga permitida
esa empresa. Solo elige con qué empresa se trabaja.

El avance se guarda por la pareja **(usuario, RUC)**.

## Matriz de permisos

| Rol | Módulos | Empresas | Guarda | Reinicia | Gestiona alumnos |
|---|---|---|---|---|---|
| **MASTER** | todos | las 10 | sí | a cualquiera | sí |
| **DOCENTE** | todos | las 10 | sí | a sí mismo y a sus estudiantes | sí |
| **PRO** | todos menos gestor | las 10 | sí | solo a sí mismo | no |
| **ASISTENTE** | todos menos gestor | las 10 | sí | no | no |
| **ESTUDIANTE** | todos menos gestor | las 10 | sí | no | no |
| **PRUEBA** | todos menos gestor | las 10 | **no** | no | no |
| **INVITADO** | Plan Contable, portal SOL y FV 621 | solo 20123456789 | **no** | no | no |

La matriz vive en la tabla `roles_permisos`: cambiar una fila cambia el comportamiento sin
tocar código. Los módulos están en la tabla `modulos` (15 registros).

## Qué ve cada quien en la portada

Probado contra los enlaces reales de `index.html` y `sol.html`:

| Botón | Módulo | INVITADO | ESTUDIANTE | DOCENTE |
|---|---|---|---|---|
| Dinámica del Plan Contable | plan_contable | sí | sí | sí |
| Operaciones en línea (SOL) | sol | sí | sí | sí |
| Mis declaraciones y pagos (FV 621) | fv621 | sí | sí | sí |
| Mis trámites y consultas | tramites | 🔒 | sí | sí |
| Declara Renta Anual (FV 710) | fv710 | 🔒 | sí | sí |
| AFP NET | afpnet | 🔒 | sí | sí |
| REMYPE / T-Registro | tregistro | 🔒 | sí | sí |
| Aplicativo de Reemplazo | reemplazo | 🔒 | sí | sí |
| Ajustes posteriores | ajustes | 🔒 | sí | sí |
| Gestor de usuarios | gestor_usuarios | 🔒 | 🔒 | sí |

Los bloqueados salen en gris con candado y, al hacer clic, muestran un cartel explicando por
qué y qué hacer. Los enlaces informativos a sunat.gob.pe y gob.pe quedan libres.

Cuando el rol no guarda (INVITADO y PRUEBA) aparece una cinta fija abajo:
*"MODO DEMOSTRACIÓN — puedes simular todo, pero tu avance no se guarda al salir."*

## Registro

Quien se registra queda como **INVITADO activo** y entra de inmediato con ese acceso limitado.
El docente después lo matricula, y al matricularlo pasa automáticamente a **ESTUDIANTE**.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `sesion.js` | **nuevo** — API de sesión, guard de enlaces, carteles y cinta demo |
| `auth.js` | login delegado a `fn_login`; entran los 7 roles; `nsKey` incluye el id del usuario; el registro entra de una |
| `login.js` | la Clave SOL ahora pasa por `fn_login_clave_sol` (valida RUC, empresa y módulo) |
| `index.html` | carga `sesion.js` y muestra un chip con el usuario y su perfil |
| 13 HTML más | cargan `sesion.js` para que funcione el guard de página |

## API disponible en el navegador

```js
Sesion.hay()                 // ¿hay sesión?
Sesion.datos()               // { usuario_id, usuario, rol, modulos, empresas, modo_demo }
Sesion.puede('plame')        // ¿el rol tiene ese módulo?
Sesion.esDemo()              // INVITADO y PRUEBA -> true
Sesion.claveSol(ruc,'SIST','NORTON','tramites')
Sesion.empresa()             // empresa activa de la puerta 2
Sesion.ns('sire_estado')     // clave de localStorage: sim_<usuario>_<ruc>_<clave>
Sesion.guardarAvance('sire', {...})   // no hace nada si el rol es demo
Sesion.leerAvance('sire')
Sesion.reiniciar(idAlumno, ruc, motivo)
```

## Pruebas ejecutadas

17 casos contra la base, todos en verde (los usuarios de prueba se borraron después):

- Registro crea INVITADO activo, con sesión, viendo 3 módulos y 8 bloqueados
- INVITADO entra al FV 621 con el RUC demo; con otro RUC → `EMPRESA_NO_PERMITIDA`;
  a PLAME → `MODULO_NO_PERMITIDO`
- Clave SOL equivocada y RUC inexistente → rechazados con su mensaje
- PRUEBA entra a PLAME con cualquier RUC, pero al guardar → bloqueado
- INVITADO y PRUEBA no pueden persistir ni llamando la API directamente (trigger en la base)
- ESTUDIANTE guarda normal

Más el mapeo de los 25 enlaces reales de la portada y del portal SOL contra los 7 roles.

## Avance independiente (ya implementado)

`SimStore` de `auth.js` fue reescrito. Antes guardaba en `sire_estado` una fila por RUC —
compartida por todos. Ahora:

- Escribe en `avance_usuario` por **(usuario_id, RUC de la empresa activa, módulo)**.
- El RUC ya no sale de la ficha del usuario sino de la **empresa elegida en la Clave SOL**,
  así que trabajar la ferretería y la botica son dos avances distintos.
- `localStorage` usa el prefijo `sim_<usuario_id>_<ruc>_`, para que dos personas en la misma
  computadora no se pisen.
- Guarda cualquier rol con `puede_guardar` (antes solo MASTER). INVITADO y PRUEBA no escriben
  nada, ni siquiera en local.
- Al validar la Clave SOL se llama a `SimStore.hydrate()`, que baja el avance de esa empresa.
- `SimStore.clearAll()` usa `fn_reiniciar_avance`, así que respeta los permisos de reinicio.

## Gestor de usuarios (gestor.html)

Pantalla aparte, solo para **DOCENTE** y **MASTER**; el botón de la portada ahora apunta ahí.
Cualquier otro rol que abra la URL directamente ve un aviso de "sin permiso".

Tiene tres bloques:

1. **Mis secciones** — crear sección (nombre, curso, ciclo). Genera un código de matrícula de
   6 caracteres. Botón para reiniciar a toda la sección de golpe.
2. **Matricular estudiante** — por nombre de usuario. Si es INVITADO pasa a ESTUDIANTE solo.
3. **Usuarios** — con buscador. Muestra perfil, secciones, cuánto avance lleva y su último
   acceso. Botones de reiniciar y retirar. El MASTER además cambia el rol desde un desplegable
   y activa o desactiva cuentas.

Arriba hay un selector de empresa: si eliges una, el reinicio afecta solo a esa; si lo dejas
en "Todas las empresas", borra el avance completo.

| Acción | DOCENTE | MASTER |
|---|---|---|
| Ver usuarios | los de sus secciones (+ búsqueda de invitados para matricular) | todos |
| Matricular / retirar | en sus secciones | en cualquiera |
| Reiniciar | a sus estudiantes y a sí mismo | a cualquiera |
| Cambiar rol | solo INVITADO ↔ ESTUDIANTE, y solo a sus alumnos | cualquier rol, a cualquiera |
| Activar / desactivar | a sus alumnos | a cualquiera |

### Pruebas del gestor

14 casos, todos correctos (datos de prueba borrados después):

- Matricular subió al invitado a ESTUDIANTE automáticamente
- El docente reinició **una sola empresa** del alumno y el avance de la otra se conservó
- El docente no pudo asignar rol PRO, ni tocar a un alumno ajeno, ni desactivarlo
- El MASTER sí cambió roles y desactivó cuentas
- Un ESTUDIANTE que abre el gestor recibe "Tu perfil no puede gestionar usuarios"
- El reinicio masivo de sección procesó a sus alumnos

## Seguridad (Paso 1 aplicado — `50_seguridad.sql`)

| Antes | Ahora |
|---|---|
| Cualquiera con la clave anon leía **todas las contraseñas en texto plano** | La tabla `usuarios` no es legible desde el navegador; las claves están en bcrypt |
| Se podían borrar los 4,181 comprobantes con un `DELETE` | La data del simulador es de **solo lectura**; anon no tiene INSERT/UPDATE/DELETE en ninguna tabla |
| Un alumno podía escribir directo en `avance_usuario` de otro | Solo se escribe llamando a las funciones, que validan el rol |
| Las funciones corrían como `anon` (SECURITY INVOKER) | `SECURITY DEFINER` con `search_path` fijo |

**Contraseñas.** Ya no se pueden ver, ni siquiera desde el panel de Supabase: solo queda el
hash. Para reponer la de un alumno se usa `fn_cambiar_clave(actor, objetivo, nueva)` — el
docente puede sobre sus estudiantes, el MASTER sobre cualquiera, y cada quien sobre sí mismo.

La clave anon del navegador está **pensada para ser pública**; lo que faltaba era que hubiera
permisos detrás limitando lo que puede hacer. Eso es lo que quedó cerrado.

### Verificado como `anon` (los permisos reales del navegador)

16 pruebas: leer contraseñas → bloqueado · leer la tabla usuarios → bloqueado · borrar
comprobantes → bloqueado · escribir avance directo → bloqueado · auto-ascenderse a MASTER →
bloqueado · leer los 4,181 comprobantes → permitido · login, registro, Clave SOL de las 10
empresas, cambio de contraseña y candado del modo demo → funcionando.

### Dos cosas que aparecieron al probar

1. **Faltaba la Clave SOL del RUC 20123456789.** La fila `SIST` de la empresa demo había sido
   convertida en la cuenta personal `DOCENTE`. La dejé como cuenta de persona (conserva su
   contraseña) y creé de nuevo la Clave SOL `SIST/NORTON` para ese RUC.
2. **Tablas de otros proyectos.** En la misma base hay 25 tablas que no son del simulador
   (`docentes`, `horarios_ptp`, `eventos`, `encuestas`, `participantes`, `stg_*`...) que siguen
   abiertas a escritura desde anon. No las toqué para no romper esas otras aplicaciones.

## Pendiente

**Paso 2 — token de sesión.** Hoy las funciones reciben el `usuario_id` como parámetro, así
que alguien podría llamar `fn_guardar_avance` con el id de un compañero y pisarle el avance.
Ya no puede leer contraseñas ni destruir la base, pero la suplantación entre alumnos sigue
abierta. Se cierra con un token aleatorio que emita `fn_login` y que las funciones resuelvan,
sin cambiar la pantalla de login.
