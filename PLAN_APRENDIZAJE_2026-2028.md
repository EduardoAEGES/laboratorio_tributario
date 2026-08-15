# Plan de aprendizaje — de contador que programa a desarrollador
### Agosto 2026 → Agosto 2028 · 10 h/semana · TypeScript full-stack

---

## Por qué tú puedes con esto

La mayoría de programadores no entiende qué es una detracción, ni por qué el IGV de una nota
de crédito va en negativo, ni qué valida SUNAT cuando rechaza un XML. Tú sí. **Ese es el
activo escaso.** Lo que te falta —programar bien— es lo que sí se puede aprender con método.

No apuntas a ser un dev genérico: apuntas a ser *el* desarrollador de software contable y
educativo tributario del Perú. Eso es un nicho pequeño, defendible y bien pagado.

**Inversión total:** ~950 horas en 24 meses. Es una hora diaria más los fines de semana.

---

## Cómo usar este plan

### Las reglas del oficio

1. **Regla de los 45 minutos.** Ante un error, peleas solo 45 minutos: lees el mensaje
   completo, pones `console.log`, usas breakpoints, buscas en la documentación oficial. Recién
   después preguntas. El 80 % del aprendizaje real ocurre en esos 45 minutos incómodos.

2. **No pegas código que no puedas explicar línea por línea.** Si no lo entiendes, no es tuyo,
   y en tres meses no vas a poder mantenerlo. Esta es la regla que separa a quien programa de
   quien ensambla.

3. **La IA es tu tutor, no tu programador.** Prohibido "hazme el módulo". Permitido: "explícame
   por qué esto falla", "¿qué alternativas hay y qué gana cada una?", "revisa mi código y dime
   qué harías distinto". Pídele que te pregunte a ti. Igual que con tus alumnos: si les das la
   respuesta, no aprenden.

4. **Cuaderno de errores.** Un archivo por mes: qué se rompió, por qué, cómo lo resolviste.
   En un año vas a tener tu propio manual, y es el mejor material de estudio que existe.

5. **Reconstruir sin mirar.** Cada vez que aprendas algo, ciérralo todo y hazlo de nuevo desde
   cero al día siguiente. Recordar cuesta y por eso funciona; releer se siente productivo y no
   lo es.

6. **Terminar vale más que empezar.** Un proyecto a la vez, terminado y desplegado, enseña más
   que cinco a medias.

### El ritmo semanal

| Cuándo | Cuánto | Qué |
|---|---|---|
| Lunes a viernes | 1 h | Teoría corta (20 min) + código (40 min) |
| Sábado | 3 h | Bloque profundo: avanzar el proyecto del trimestre |
| Domingo | 1 h | Repasar el cuaderno de errores, leer código ajeno, escribir lo aprendido |

Si una semana no puedes, no pasa nada. Si tres semanas seguidas no puedes, revisa el plan: es
mejor bajar la meta que abandonarla.

---

## Mapa de los 8 trimestres

| # | Meses | Foco | Entregable de portafolio |
|---|---|---|---|
| T1 | 1-3½ | Fundamentos de JS, **HTML/CSS**, web y Git | Plan Contable reescrito sin frameworks |
| T2 | 4-6 | TypeScript, testing y diseño de tipos | `taxlab-core`: motor de cálculo tributario en npm |
| T3 | 7-9 | Backend, PostgreSQL y seguridad | API propia del simulador (adiós a las `fn_*`) |
| T4 | 10-12 | Frontend moderno + motor de simuladores y juegos | Simulador v2 con escenarios + mini-juego PCGE |
| T5 | 13-15 | Facturación electrónica: XML, firma, web services | CLI que emite y firma en el ambiente beta |
| T6 | 16-18 | El facturador como producto vendible | SaaS con clientes piloto reales |
| T7 | 19-21 | IA aplicada: tutores y mensajes inteligentes | Tutor que corrige declaraciones citando la norma |
| T8 | 22-24 | Producción, observabilidad y portafolio | Todo desplegado + casos de estudio escritos |

Tres hilos que se cruzan: **fundamentos** (T1-T4), **producto** (T5-T6) e **IA** (T7). El T4
es la bisagra: ahí conviven los simuladores y los juegos académicos.

---

# TRIMESTRE 1 · Meses 1-3
## Fundamentos: entender qué pasa de verdad

**El objetivo real:** dejar de copiar y pegar patrones que funcionan por casualidad.

### Qué aprender

**Cómo funciona la web** (semana 1-2)
- Qué hace el navegador desde que escribes una URL hasta que ves la página
- HTTP: métodos, códigos de estado, headers, cookies. Qué es CORS y por qué te va a molestar
- Cliente vs servidor: qué corre dónde y por qué importa para la seguridad

**HTML y CSS** (semanas 8-10) — *ver el anexo al final con el detalle tema por tema*
- HTML: semántica, tablas de datos y sobre todo **formularios** (el 70 % de un simulador)
- CSS: cascada y especificidad, modelo de caja, **Flexbox y Grid**, variables, responsive
- Nada de Sass ni frameworks todavía. En el T1 se maqueta a mano

**JavaScript de verdad** (semana 3-9)
- Tipos, coerción, `==` vs `===`, valores falsy. Por qué `0.1 + 0.2 !== 0.3` (y qué significa
  eso para los importes en soles)
- Scope, closures, `this`, prototipos. Esto se entiende una vez y sirve para siempre
- Arrays y objetos: `map`, `filter`, `reduce`, desestructuración, spread. Inmutabilidad
- Asincronía: event loop, promesas, `async/await`, manejo de errores. Aquí se cae la mayoría
- Módulos ES: `import`/`export`. Cómo se organiza un proyecto sin un archivo de 5 000 líneas
- DOM y eventos: selección, delegación, burbujeo, `fetch`

**Herramientas** (transversal)
- Terminal: navegar, mover, buscar. 20 comandos te alcanzan
- Git: commits atómicos con mensajes que se entiendan, ramas, merge, resolver conflictos,
  `.gitignore`. Y qué hacer cuando algo sale mal (`reflog` te va a salvar)
- VS Code: atajos, búsqueda global, extensiones mínimas
- DevTools: breakpoints, watch, la pestaña Network, ver el localStorage

### Recursos

- **[javascript.info](https://javascript.info)** — completo, en español, el mejor recurso
  gratuito que existe. Es tu columna vertebral este trimestre
- **[MDN](https://developer.mozilla.org/es/)** — la referencia. Aprende a buscar aquí antes que
  en Google
- **[The Odin Project](https://www.theodinproject.com)** — Foundations, por los ejercicios
- **[Learn Git Branching](https://learngitbranching.js.org/?locale=es_ES)** — Git visual, 2 horas

### Proyecto del trimestre
**Reescribir la Dinámica del Plan Contable desde cero.** Sin frameworks, sin IA, sin copiar tu
código anterior. Módulos ES separados, sin variables globales, con manejo de errores. Súbelo a
GitHub con commits del proceso, no uno solo al final.

### Sabrás que terminaste cuando puedas
- Explicarle a un alumno qué es un closure con un ejemplo tuyo
- Encontrar un bug con breakpoints en vez de con `console.log` a ciegas
- Escribir `async/await` con `try/catch` sin pensarlo
- Hacer un commit, una rama y un merge sin buscar los comandos

---

# TRIMESTRE 2 · Meses 4-6
## TypeScript y calidad: que el compilador te cuide

**El objetivo real:** que los errores tributarios sean imposibles de escribir, no que se
descubran en producción.

### Qué aprender

**TypeScript** (semana 1-6)
- Tipos básicos, inferencia, `interface` vs `type`, uniones, narrowing
- Genéricos: cuándo hacen falta de verdad y cuándo son adorno
- Tipos que modelan tu dominio: `RUC`, `Periodo`, `Moneda`, `TipoComprobante`. Un `string` no
  es un RUC
- Hacer imposibles los estados imposibles: si una factura es de exportación, el IGV **no puede**
  existir. Que el tipo lo impida
- `strict: true` desde el día uno

**Testing** (semana 5-10)
- Vitest: `describe`, `it`, `expect`. Correr tests en cada guardado
- Qué probar: los bordes. Redondeos, el importe cero, el negativo de la nota de crédito, el
  umbral exacto de la detracción (¿700.00 o 700.01?)
- TDD en lo que sirve: para reglas de cálculo es ideal
- Tests como documentación viva de la norma tributaria

**Diseño de código** (semana 8-12)
- Funciones puras, un solo propósito, nombres que no necesiten comentario
- Cuándo extraer una función y cuándo no (la sobre-ingeniería también es un problema)
- Manejo de dinero: nunca `float` para importes. Enteros en céntimos o `decimal.js`
- Estructuras de datos y complejidad al nivel que necesitas: array vs objeto vs Map, y por qué
  un bucle dentro de otro sobre 4 000 comprobantes se siente lento

### Recursos

- **[Total TypeScript](https://www.totaltypescript.com)** — los ejercicios gratuitos son oro
- **[Vitest](https://vitest.dev)** — la documentación oficial alcanza
- **[Refactoring Guru](https://refactoring.guru/es)** — code smells; los patrones déjalos para
  después

### Proyecto del trimestre
**`taxlab-core`: tu motor de cálculo tributario como librería.** TypeScript puro, sin
dependencias, publicada en npm. Que calcule IGV, detracciones con sus umbrales, renta de 5ta
con la escala, gratificaciones, EsSalud, ONP/AFP. Cobertura de tests alta y cada regla con su
caso límite. Con un README que explique la base legal de cada cálculo.

Esta pieza sola ya te distingue: un motor de cálculo tributario peruano bien testeado no lo
tiene cualquiera.

### Sabrás que terminaste cuando
- El compilador te impida escribir una factura de exportación con IGV
- Tengas un test que falle y te salve al cambiar una tasa
- Puedas publicar `npm install taxlab-core` y que funcione

---

# TRIMESTRE 3 · Meses 7-9
## Backend y base de datos: dejar de depender de Supabase

**El objetivo real:** entender qué hace un servidor, para poder construir uno y no solo
consumirlo.

### Qué aprender

**Node y APIs** (semana 1-5)
- Node: módulos, `fs`, variables de entorno, npm scripts
- Fastify (o Express): rutas, middlewares, manejo centralizado de errores
- REST de verdad: recursos, verbos, códigos de estado correctos, paginación
- Validación en el borde con Zod: nunca confíes en lo que llega
- Capas: rutas → servicios → repositorios. Por qué la lógica no va en la ruta

**PostgreSQL en serio** (semana 4-9)
- Modelado: claves, relaciones, normalización y cuándo desnormalizar a propósito
- SQL más allá del select: joins, agregaciones, CTEs, funciones de ventana
- Índices: cuándo ayudan, cuándo estorban, cómo leer un `EXPLAIN ANALYZE`
- Transacciones y niveles de aislamiento. Qué pasa si dos alumnos declaran a la vez
- Migraciones versionadas (Drizzle) — nunca más cambios a mano en producción
- Backups y restauración: practícalo antes de necesitarlo

**Seguridad** (semana 8-12)
- Hash de contraseñas con argon2 y por qué nunca en texto plano (ya lo viviste)
- Sesiones con cookies httpOnly vs JWT: qué gana y qué pierde cada uno
- El OWASP Top 10 con ejemplos: inyección SQL, XSS, CSRF, control de acceso roto
- Rate limiting, secretos fuera del código, principio de mínimo privilegio

### Recursos

- **[Documentación de PostgreSQL](https://www.postgresql.org/docs/current/tutorial.html)** —
  densa pero es la fuente
- **[Use The Index, Luke](https://use-the-index-luke.com/es)** — índices explicados de verdad
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)**
- **[Fastify](https://fastify.dev)**

### Proyecto del trimestre
**La API propia del simulador.** Reemplaza las funciones `fn_*` de Supabase por tu backend:
login con sesiones, permisos por rol, avance por usuario y empresa, gestión de alumnos. Con
tests de integración y migraciones versionadas. El frontend actual casi no cambia — y eso te va
a enseñar el valor de una buena frontera entre capas.

### Sabrás que terminaste cuando puedas
- Explicar por qué una operación necesita transacción y otra no
- Leer un `EXPLAIN` y decidir dónde va un índice
- Contar por qué elegiste sesiones o JWT, con sus contras

---

# TRIMESTRE 4 · Meses 10-12
## Simuladores y juegos académicos: tu especialidad

**El objetivo real:** que crear un simulador nuevo te tome días y no meses, porque tienes un
motor y no un montón de páginas sueltas.

### Qué aprender

**Frontend moderno** (semana 1-5)
- React con TypeScript (o Svelte, más simple y suficiente para lo tuyo)
- Componentes, estado, efectos y por qué el estado global casi nunca hace falta
- Formularios complejos con validación — el 70 % de un simulador tributario son formularios
- Tablas de miles de filas sin que se congele: virtualización
- Accesibilidad básica: teclado, foco, contraste. Tus alumnos lo van a agradecer

**Arquitectura de simuladores** (semana 4-9) — *el corazón de tu especialidad*
- **Máquinas de estado**: un trámite SUNAT es exactamente eso. Estados, transiciones,
  transiciones prohibidas. Con XState o una implementación propia
- **Escenarios como datos, no como código**: el caso del alumno vive en un JSON; el motor lo
  interpreta. Agregar un ejercicio nuevo no debe requerir programar
- **Generación determinística con semilla**: la misma semilla produce la misma empresa con los
  mismos comprobantes. Sirve para exámenes reproducibles y para depurar
- **Motor de calificación**: comparar lo declarado contra lo esperado, con tolerancias, y
  explicar la diferencia. Ya tienes `resumen_fv621`, esto lo formaliza
- **Bitácora y replay**: registrar cada acción del alumno para poder reproducir su sesión.
  Vale oro para entender dónde se traban
- **Analítica de aprendizaje**: en qué paso se atascan, cuánto tardan, qué error se repite

**Juegos académicos** (semana 8-12)
- Bucle de juego, tiempo, animación con `requestAnimationFrame`
- Canvas cuando el DOM no alcanza; Phaser si quieres algo con más cuerpo
- Diseño de dificultad: la curva, el error productivo, el feedback inmediato
- Gamificación honesta: puntos que midan algo real, no confeti vacío
- Modos: contrarreloj, por niveles, competencia entre secciones

**Pruebas de interfaz**
- Playwright: probar el flujo completo como si fuera un alumno

### Recursos

- **[React](https://react.dev/learn)** o **[Svelte](https://svelte.dev/tutorial)**
- **[XState](https://stately.ai/docs)** — máquinas de estado
- **[Playwright](https://playwright.dev)**
- **[Game Programming Patterns](https://gameprogrammingpatterns.com)** — gratis en web; el
  capítulo de game loop y state aplica igual a simuladores serios
- **[Refactoring UI](https://www.refactoringui.com)** — de pago, pero te arregla el diseño sin
  ser diseñador

### Proyecto del trimestre
**Dos piezas:**
1. **Simulador SUNAT v2**: un módulo (el FV 621) rehecho como app React+TS sobre tu motor de
   escenarios. Meta concreta: **agregar un caso nuevo editando solo un JSON**
2. **Mini-juego del PCGE**: clasificar cuentas contra reloj, con niveles, ranking por sección y
   estadísticas de error por tipo de cuenta

### Sabrás que terminaste cuando
- Un colega docente pueda crear un ejercicio nuevo sin tocar código
- Puedas reproducir la sesión de un alumno paso a paso desde la bitácora

---

# TRIMESTRE 5 · Meses 13-15
## Facturación electrónica I: el estándar por dentro

**El objetivo real:** que ninguna librería sea una caja negra para ti. Si el día de mañana
SUNAT cambia una regla, tú la implementas.

### Qué aprender

**XML y UBL 2.1** (semana 1-4)
- XML: estructura, namespaces (aquí se traba todo el mundo), XSD, XPath
- El estándar UBL 2.1 y cómo lo adapta SUNAT: la factura, la boleta, las notas de crédito y
  débito
- Las **guías de elaboración de XML** que publica SUNAT en su portal CPE: son tu especificación,
  léelas enteras
- Los catálogos: tipo de documento, moneda, unidad de medida, tributos, tipo de operación
- Las reglas de validación y sus códigos de error. Cada rechazo tiene un número y un motivo

**Criptografía aplicada** (semana 4-8)
- Qué es una firma digital y por qué prueba integridad y autoría
- Certificados X.509, PKCS#12 (`.pfx`), la cadena de confianza, ROPS de INDECOPI
- **XAdES-BES**: cómo se firma un XML, qué es la canonicalización C14N y por qué un espacio de
  más invalida la firma
- Errores típicos de firma y cómo diagnosticarlos

**Comunicación con SUNAT** (semana 8-12)
- SOAP y WS-Security: cómo se autentica el envío
- Envío individual, por lotes (ZIP), tickets y consulta de estado
- El CDR: qué significa aceptado, aceptado con observaciones y rechazado
- El ambiente de pruebas (beta) y cómo trabajar contra él

### Recursos

- **[Portal CPE de SUNAT](https://cpe.sunat.gob.pe)** — guías XML, catálogos, normas. Fuente
  primaria y obligatoria
- **[Greenter](https://greenter.dev)** — implementación peruana de código abierto en PHP. No la
  vas a usar, la vas a **leer**: es el mejor mapa del territorio que existe
- Especificación **[UBL 2.1 de OASIS](http://docs.oasis-open.org/ubl/UBL-2.1.html)** para
  consultas puntuales

### Proyecto del trimestre
**Un CLI que emite de verdad.** Recibe los datos de una factura, arma el XML UBL 2.1, lo firma
con un certificado de prueba, lo envía al ambiente beta de SUNAT y guarda el CDR. Sin librerías
de facturación: solo XML, criptografía y HTTP.

El día que veas tu primer CDR aceptado, generado por código tuyo, vas a entender por qué valió
la pena.

### Sabrás que terminaste cuando puedas
- Explicar cada nodo del XML y por qué está ahí
- Diagnosticar una firma inválida sin adivinar
- Leer un código de rechazo de SUNAT y saber qué corregir

---

# TRIMESTRE 6 · Meses 16-18
## Facturación electrónica II: de proyecto a producto

**El objetivo real:** que un cliente real emita un mes completo sin que tengas que intervenir.
Ahí deja de ser un ejercicio.

### Qué aprender

**Lo que separa un demo de un producto**
- Multiempresa y multiusuario con aislamiento real de datos
- Series y correlativos bajo concurrencia: dos usuarios emitiendo a la vez no pueden repetir
  número. Aquí sí necesitas transacciones y bloqueos
- Idempotencia: si el cliente da doble clic, no se emiten dos facturas
- Colas de trabajo y reintentos: SUNAT se cae, la red falla, el proceso debe recuperarse solo
- Contingencia: qué hace el sistema cuando SUNAT no responde por horas

**El resto de documentos**
- Notas de crédito y débito con su referencia al documento original
- Resumen diario de boletas y comunicación de baja
- Guías de remisión electrónicas
- Representación impresa: PDF con el QR y los datos obligatorios

**Operación real**
- Gestión de certificados digitales: vencimientos, renovación, almacenamiento seguro
- Envío directo a SUNAT vs a través de un OSE: qué conviene según el volumen
- El proceso de homologación antes de producción
- Respaldos y conservación de los comprobantes por el plazo legal
- Monitoreo: enterarte de que algo falló antes que tu cliente

**El negocio**
- Precios: por documento, por plan, o mixto
- Contrato, términos de servicio, responsabilidad, SLA
- Soporte: canal, horario y expectativas claras. Este es el costo que todos subestiman

### Proyecto del trimestre
**Tu facturador SaaS con 2 clientes piloto reales.** Empieza con conocidos que te toleren los
errores. Cóbrales poco pero cóbrales: un cliente que paga te da retroalimentación honesta.

### Sabrás que terminaste cuando
- Un cliente emita un mes completo sin escribirte
- Tengas un runbook de qué hacer cuando SUNAT no responde
- Sepas exactamente cuánto te cuesta atender a un cliente al mes

> **Aviso honesto:** operar un facturador en producción implica responsabilidad legal frente a
> los comprobantes de tus clientes. Antes de vender, consulta las obligaciones vigentes del
> emisor y considera un seguro o una figura societaria que limite tu exposición. No es para
> asustarte, es parte del oficio.

---

# TRIMESTRE 7 · Meses 19-21
## IA aplicada: tutores que enseñan de verdad

**El objetivo real:** un tutor que detecte el error conceptual del alumno y lo guíe, no un
chatbot que regala respuestas.

### Qué aprender

**Cómo funciona una API de LLM** (semana 1-3)
- Tokens, ventana de contexto, temperatura, y cómo se traduce todo eso en costo y latencia
- Streaming de respuestas para que la interfaz no se sienta congelada
- Manejo de errores, reintentos y límites de gasto

**Prompting con ingeniería** (semana 2-6)
- Prompt de sistema, few-shot, cadena de pasos
- **Salida estructurada**: pedir JSON con esquema en vez de texto libre. Esto convierte al
  modelo en un componente confiable de tu sistema
- **Function/tool calling**: que el modelo consulte el avance real del alumno en tu base antes
  de opinar
- Versionar los prompts como código, porque son código

**RAG sobre normativa** (semana 5-9)
- El problema: el modelo no conoce la última resolución de SUNAT, y si la inventa haces daño
- Chunking de documentos normativos, embeddings, búsqueda vectorial con pgvector
- **Citas obligatorias**: toda afirmación normativa apunta a su fuente. Sin cita, no se muestra
- Cuándo RAG no es la respuesta

**Diseño pedagógico del tutor** (semana 8-12) — *aquí tu experiencia docente manda*
- Andamiaje socrático: preguntar antes de responder, dar la pista mínima
- Detectar el error conceptual detrás del error numérico: no es "te equivocaste en 180 soles",
  es "estás incluyendo el IGV en la base imponible"
- Mensajes automáticos por hito: al atascarse, al terminar un módulo, al repetir un error
- Cuándo el tutor debe callarse y dejar que el alumno pelee

**Evaluación y seguridad** (semana 10-12)
- Golden set: 50 casos con su respuesta correcta, para medir si el tutor mejora o empeora
- Medir alucinación con datos, no con impresiones
- Datos personales de alumnos: qué mandas al modelo y qué no
- Inyección de prompt: qué pasa si un alumno escribe "ignora tus instrucciones"

### Recursos

- Documentación de la API que uses (**[Anthropic](https://docs.claude.com)**, OpenAI o la que
  prefieras) — empieza por su guía de prompt engineering
- **[pgvector](https://github.com/pgvector/pgvector)**
- Para la parte pedagógica, tu propia experiencia en aula vale más que cualquier curso

### Proyecto del trimestre
**El tutor dentro del simulador.** Revisa la declaración del alumno, la compara contra
`resumen_fv621`, identifica el error conceptual y lo guía con preguntas, citando la norma. Con
mensajes automáticos cuando lleva mucho tiempo atascado.

### Sabrás que terminaste cuando
- Puedas demostrar con tu golden set que la versión 3 del prompt es mejor que la 1
- El tutor diga "no lo sé con certeza" en vez de inventar cuando no tiene la fuente

---

# TRIMESTRE 8 · Meses 22-24
## Producción y portafolio: que se vea y que no se caiga

### Qué aprender

**Infraestructura**
- Docker: empaquetar tu app para que corra igual en todas partes
- CI/CD con GitHub Actions: tests automáticos en cada push, despliegue con un merge
- Entornos separados (desarrollo, pruebas, producción) y gestión de secretos
- Migraciones sin tumbar el servicio

**Observabilidad**
- Logs estructurados que sirvan a las 2 de la mañana
- Sentry para errores, métricas de uso, alertas cuando algo se rompe
- Un panel donde veas: usuarios activos, comprobantes emitidos, errores del día

**Rendimiento y costos**
- Medir antes de optimizar
- Caché donde de verdad importa
- Cuánto cuesta cada usuario al mes, entre base de datos, hosting y tokens de IA

### El portafolio

Cinco piezas, cada una con **repositorio público, demo en vivo, README serio y un caso de
estudio escrito**:

| Pieza | Qué demuestra |
|---|---|
| `taxlab-core` | Dominio tributario + tipos + testing riguroso |
| Simulador SUNAT v2 | Arquitectura, motor de escenarios, producto educativo real con usuarios |
| Juego del PCGE | Interactividad, diseño de aprendizaje, algo que se disfruta usar |
| Facturador | Estándares, criptografía, integración con el Estado, producto que factura |
| Tutor con IA | IA aplicada con criterio, evaluada y con citas |

**El caso de estudio importa tanto como el código.** Para cada pieza, una página con: qué
problema resolvía, qué decisiones tomaste y por qué, qué salió mal, qué aprendiste. Eso es lo
que un cliente o un empleador lee de verdad.

**Escribe una vez al mes.** Un artículo sobre algo que resolviste: "cómo funciona la firma
XAdES en una factura peruana", "por qué el redondeo del IGV rompe las conciliaciones". Casi
nadie escribe sobre esto en español. En dos años serías una referencia en un nicho vacío.

---

## Errores que te van a costar meses

| Error | Cómo se ve | El antídoto |
|---|---|---|
| Infierno de tutoriales | Terminas cursos, no proyectos | Un proyecto por trimestre, terminado y desplegado |
| Cambiar de stack | "Mejor aprendo Rust / Go / Vue" | Un stack por dos años. La constancia gana |
| Empezar por el framework | React sin entender JS | El T1 no se salta |
| Copiar sin entender | Funciona pero no sabes por qué | La regla de explicar línea por línea |
| Sobre-ingeniería | Microservicios para 30 alumnos | Lo más simple que funcione |
| No versionar | "codigo_final_v3_bueno.js" | Git desde el primer día |
| No probar | Corriges lo mismo tres veces | Tests en las reglas de cálculo, sin excusa |
| Perfeccionismo | Nunca publicas | Publica en cuanto sea útil, mejora después |

---

## Presupuesto aproximado

| Concepto | Costo estimado |
|---|---|
| Certificado digital de prueba y producción | S/ 90 - 250 al año |
| Dominio | S/ 40 al año |
| Hosting (Vercel/Railway/Fly) | Gratis al inicio; S/ 20-80 al mes con clientes |
| API de IA para desarrollo y pruebas | US$ 10-30 al mes |
| Libros y algún curso pago | S/ 300 en total, opcional |

Casi todo lo importante es gratuito. Lo caro es el tiempo.

---

## Lo que NO debes aprender todavía

Kubernetes · microservicios · GraphQL · Rust o Go · blockchain · machine learning desde cero ·
patrones de diseño avanzados · arquitectura hexagonal.

Todo eso es real y útil en su contexto, y nada de eso te acerca a tus objetivos en estos dos
años. La dispersión es el enemigo. Cuando algo de la lista te haga falta de verdad, lo vas a
saber porque te va a doler su ausencia.

---

## Revisión cada trimestre

Cada tres meses, media hora contigo mismo:

1. ¿Terminé el proyecto? Si no, ¿por qué?
2. ¿Qué me costó más de lo que esperaba?
3. ¿El ritmo es sostenible o me estoy engañando?
4. ¿Sigue teniendo sentido el siguiente trimestre, o cambió algo?

El plan es una guía, no un contrato. Si en el T5 descubres que la facturación te aburre y los
juegos educativos te apasionan, cambia el plan. Lo que no se negocia es la hora diaria.

---

# ANEXO · HTML y CSS al detalle

**HTML son unas 10 horas; CSS unas 25.** Van en las semanas 8, 9 y 10 del T1, en paralelo con
el DOM: el HTML y el CSS son el material sobre el que practicas JavaScript.

## HTML — 10 horas

| Tema | Qué debes poder hacer | Dónde lo usas |
|---|---|---|
| **Documento** | doctype, `html lang`, head, meta charset y **viewport**, title, favicon | Toda página. El viewport es lo que hace que se vea bien en celular |
| **Semántica** | `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, jerarquía de `h1` a `h6` | La estructura de tus simuladores |
| **Texto y enlaces** | `p`, listas, `strong` vs `b`, `a` con `target` y `rel`, `img` con `alt`, `figure` | Guías y ayudas del simulador |
| **Tablas de datos** | `table`, `caption`, `thead`/`tbody`/`tfoot`, `th` con `scope`, `colspan` | Registro de ventas y compras, planillas |
| **Formularios: estructura** | `form`, `label` asociado con `for`, `fieldset`, `legend`, `button type` | El 70 % de un simulador tributario |
| **Formularios: campos** | `input` text/number/date/email/tel/checkbox/radio/file/hidden, `select`, `optgroup`, `textarea` | Casillas del FV 621, datos del T-Registro |
| **Formularios: validación** | `required`, `min`/`max`, `step`, `pattern`, `autocomplete`, `disabled` vs `readonly` | Validar el RUC antes de llegar al servidor |
| **Accesibilidad** | Orden de tabulación, foco visible, `aria-label`, contraste | Que se pueda usar todo con el teclado |

## CSS — 25 horas

**Cómo funciona** (8 h) — sin esto lo demás es adivinar

| Tema | Qué debes poder hacer |
|---|---|
| Selectores | Tipo, clase, id, atributo, descendiente, hijo, hermano adyacente |
| Pseudoclases y pseudoelementos | `:hover`, `:focus-visible`, `:disabled`, `:checked`, `:nth-child`, `:not`, `:has`, `::before`, `::after` |
| **Cascada y especificidad** | Por qué gana una regla sobre otra, herencia, por qué evitar `!important` |
| **Modelo de caja** | content, padding, border, margin, `box-sizing: border-box`, colapso de márgenes |
| display y unidades | block, inline, inline-block, flow-root · px, rem, em, %, vh, ch, fr |

**Layout** (10 h) — el corazón del asunto

| Tema | Qué debes poder hacer | Dónde |
|---|---|---|
| **Flexbox** | direction, justify-content, align-items, gap, grow/shrink/basis, wrap | Barras, filas de botones, campos en línea. El 60 % |
| **Grid** | template-columns, `fr`, `repeat`, `minmax`, `auto-fit`, areas | Tableros, formularios de dos columnas, tarjetas del portal SOL |
| Flex o Grid | Decidir rápido cuál toca y cómo se combinan | Todos los días |
| Posicionamiento | relative, absolute, fixed, **sticky**, contexto de apilamiento y `z-index` | Modales, menús, encabezado de tabla fijo al desplazar |
| Overflow y tamaños | overflow, scroll, height vs min-height, aspect-ratio | Tablas de 4 000 comprobantes |

**Adaptable y sistema de diseño** (5 h)

| Tema | Qué debes poder hacer |
|---|---|
| Mobile first | Media queries y breakpoints razonables. Probar en un celular real |
| Container queries | `@container`: el componente se adapta a su contenedor, no a la pantalla |
| Tamaños fluidos | `clamp()`, `min()`, `max()` para tipografía y espaciados |
| **Variables CSS** | Tokens de color, espaciado, radios y sombras · tema claro y oscuro |
| Anidamiento y `@layer` | Organizar sin necesidad de Sass |

**Presentación** (6 h)

| Tema | Qué debes poder hacer |
|---|---|
| Tipografía | Fuentes web, line-height, escala tipográfica |
| Color y contraste | hex, rgb, hsl, oklch, `color-mix`, contraste accesible |
| Bordes y sombras | border-radius, box-shadow, gradientes |
| Transiciones | `transition`, `transform`, `@keyframes` simples, `prefers-reduced-motion` |
| **`@media print`** | Saltos de página, ocultar navegación, márgenes. **Clave para ti**: representación impresa de comprobantes y reportes de aula |

**Práctica** (3 h): organización del CSS (un archivo por componente o BEM ligero), DevTools de
CSS para depurar Grid y Flex en vivo, reset moderno, y `content-visibility` en listas largas.

## Lo que NO debes aprender

- **Floats para maquetar y clearfix** — murieron con Flexbox y Grid
- **El sistema de rejilla de Bootstrap** — Grid nativo hace lo mismo y mejor
- **Sass o Less** — CSS ya tiene variables, anidamiento y funciones nativas. Aprenderlo hoy es
  sumar un paso de compilación para resolver un problema que ya no existe. Solo si heredas un
  proyecto que ya lo usa, y en ese caso se aprende en una tarde
- **CSS-in-JS** y **animaciones complejas** — no son tu negocio

## Cuándo sí el framework

Un framework **no te ahorra entender el layout, solo escribirlo**. Si no sabes Grid, Tailwind
te dará clases que no entiendes y estarás igual de perdido, con nombres más cortos.

- **T1**: todo a mano. Tu Plan Contable maquetado por ti
- **T4**: recién ahí Tailwind junto con React, y componentes accesibles ya hechos (shadcn/ui)
  para modales y desplegables, que son sorprendentemente difíciles de hacer bien

## Recursos

- **[Web.dev Learn CSS](https://web.dev/learn/css)** — el mejor curso de CSS moderno, de Google
- **[Web.dev Learn HTML](https://web.dev/learn/html)** — incluye formularios y accesibilidad
- **[MDN: formularios](https://developer.mozilla.org/es/docs/Learn/Forms)** — el bloque que más te importa
- **[Flexbox Froggy](https://flexboxfroggy.com/#es)** y **[Grid Garden](https://cssgridgarden.com/#es)** — dos tardes jugando y sale valiendo

---

*Plan creado en agosto de 2026, ampliado con el anexo de HTML y CSS. Revísalo en noviembre de
2026, al cerrar el T1.*
