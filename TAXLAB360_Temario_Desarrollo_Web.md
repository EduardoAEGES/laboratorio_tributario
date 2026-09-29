# TAXLAB 360 — Guía Teórico-Práctica de Desarrollo Web
## Temario Detallado (de CERO absoluto)

**HTML · CSS · JavaScript · Supabase · Git**
*Elaborado por el Equipo de Contabilidad CERTUS*
*Del cero absoluto a construir y publicar tu propio simulador*

---

## Bienvenida: cómo usar esta guía

Esta guía está pensada para alguien que parte de **CERO absoluto**: no necesitas saber nada de programación. Al terminar serás capaz de **entender, construir y publicar** un sitio web como TAXLAB 360.

**Metodología teórico-práctica**
- **Teoría:** cada tema explica el "qué" y el "por qué" con palabras sencillas y analogías.
- **Práctica:** al final de cada módulo aplicas lo aprendido reconstruyendo una parte real del proyecto.
- **Proyecto guía:** usaremos TAXLAB 360 como ejemplo constante, para que todo tenga sentido real.

**Consejos para aprender bien**
- Escribe el código a mano; no copies y pegues. Se aprende con los dedos.
- Equivocarse es parte del proceso: usa la consola (F12) para entender los errores.
- Avanza en orden. Cada módulo se apoya en el anterior.
- Practica poco cada día, mejor que mucho un solo día.

### Ruta de aprendizaje (resumen)

| Módulo | Tema | Duración aprox. |
|:---:|---|---|
| 0 | Fundamentos: cómo funciona la web y tus herramientas | 1 semana |
| 1 | HTML: la estructura de toda página | 2 semanas |
| 2 | CSS: darle diseño y vida visual | 3 semanas |
| 3 | JavaScript I: lógica y programación básica | 3 semanas |
| 4 | JavaScript II: manipular la página (DOM y eventos) | 3 semanas |
| 5 | Guardar información en el navegador | 1 semana |
| 6 | JavaScript III: asincronía y conexión a servidores (APIs) | 2 semanas |
| 7 | Backend con Supabase: bases de datos en la nube | 3 semanas |
| 8 | Arquitectura del proyecto TAXLAB 360 | 2 semanas |
| 9 | Git, GitHub y despliegue en Vercel | 1 semana |
| 10 | Proyecto final integrador | 3–4 semanas |

---

## Módulo 0. Fundamentos: cómo funciona la web y tus herramientas

> **Objetivo:** entender qué es una página web, cómo viaja del servidor a tu pantalla, y dejar tu computadora lista para programar.
> **Duración:** 1 semana (4–6 horas)
> **Al terminar:** tener VS Code instalado, abrir tu primer archivo `.html` en el navegador y entender las 3 piezas: HTML, CSS y JavaScript.

**Contenido teórico**

**¿Qué es Internet y la Web?**
- Diferencia entre Internet y la Web
- Cliente y servidor: quién pide y quién responde
- El navegador (Chrome, Brave, Edge) como "lector" de páginas
- Qué es una URL y un dominio (ej. `laboratorio-tributario.vercel.app`)
- Qué es HTTP y qué significa una petición y una respuesta

**Las 3 capas de una página**
- HTML = estructura (el esqueleto)
- CSS = diseño (la ropa y el maquillaje)
- JavaScript = comportamiento (el movimiento y la lógica)
- Analogía con una casa: paredes, pintura e instalaciones

**Sitio estático vs. dinámico**
- Qué es un sitio estático (archivos HTML/CSS/JS servidos tal cual) — así es TAXLAB 360
- Qué es un backend y una base de datos (introducción)
- Por qué este proyecto no usa "framework" ni "build"

**Herramientas de trabajo**
- Instalar Visual Studio Code (el editor)
- Extensión Live Server para ver cambios al instante
- Las DevTools del navegador (F12): Elementos, Consola, Red
- Cómo se organiza un proyecto en carpetas y archivos

**Práctica (aplicada a TAXLAB 360)**
- Crear la carpeta del proyecto y un archivo `index.html` con "Hola mundo"
- Abrirlo con Live Server y ver el resultado
- Abrir las DevTools y encontrar tu texto en la pestaña "Elementos"

---

## Módulo 1. HTML: la estructura de toda página

> **Objetivo:** aprender a construir el esqueleto de una página: textos, imágenes, enlaces, tablas y formularios.
> **Duración:** 2 semanas (8–10 horas)
> **Al terminar:** maquetar (sin diseño aún) la portada y el portal SOL: cabecera, tarjetas, botones y formulario de acceso.

**Contenido teórico**

**Anatomía de HTML**
- Etiquetas, elementos y atributos
- Etiquetas de apertura y cierre; etiquetas vacías (`img`, `input`)
- La estructura base: `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`
- El `<head>`: `title`, `charset` (UTF-8) y `viewport` (para móvil)
- Comentarios en HTML

**Contenido de texto**
- Encabezados `<h1>` a `<h6>` y jerarquía
- Párrafos `<p>`, negritas `<strong>`, énfasis `<em>`, saltos `<br>`
- Listas ordenadas `<ol>`, no ordenadas `<ul>` y de ítems `<li>`

**Enlaces, imágenes y multimedia**
- Enlaces `<a href>` y el atributo `target="_blank"`
- Rutas relativas (`sol.html`, `../index.html`) vs. absolutas (`https://...`)
- Imágenes `<img src alt>`
- Video `<video>` (como el gatito `logo_gif_gato.mp4`)
- Íconos con Font Awesome

**Contenedores y semántica**
- `<div>` y `<span>`: las cajas genéricas
- Etiquetas semánticas: `<header>`, `<main>`, `<footer>`, `<section>`, `<aside>`, `<nav>`
- Atributos `id` y `class` (clave para CSS y JavaScript)
- Accesibilidad: `aria-label`, `alt`, títulos

**Tablas**
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- Cuándo usar tablas (datos) y cuándo NO (maquetación)
- Ejemplo real: la tabla del PCGE en el módulo de dinámica

**Formularios**
- `<form>`, `<input>` (text, password, email, tel, checkbox)
- `<label>`, `<select>` y `<option>`, `<textarea>`, `<button>`
- `placeholder`, `required` y otros atributos
- Ejemplo real: la Clave SOL (RUC + usuario + contraseña)

**Práctica (aplicada a TAXLAB 360)**
- Escribir el HTML de la cabecera del portal SOL (logo + título)
- Crear las tarjetas "Mis Declaraciones" y "Mis Trámites" con sus botones
- Construir el formulario de Clave SOL con sus campos y etiquetas

---

## Módulo 2. CSS: darle diseño y vida visual

> **Objetivo:** transformar el HTML "feo" en una interfaz profesional: colores, tipografías, espaciado, tarjetas, botones y diseño responsivo.
> **Duración:** 3 semanas (12–15 horas)
> **Al terminar:** reproducir el look de TAXLAB 360: cabecera azul, tarjetas con sombra, botones con hover y el gatito flotante fijo.

**Contenido teórico**

**Cómo se aplica CSS**
- Tres formas: en línea (`style="..."`), interno (`<style>`) y externo (`<link>`)
- Por qué el CSS externo (`style.css`, `sol.css`) es la mejor práctica
- Anatomía de una regla: `selector { propiedad: valor; }`

**Selectores**
- Por etiqueta (`p`), por clase (`.card`), por id (`#header`)
- Selectores descendientes y agrupados
- Especificidad: por qué a veces "no me aplica el estilo"
- Pseudo-clases `:hover`, `:focus`, `:nth-child`

**El modelo de caja (Box Model)**
- `content`, `padding`, `border` y `margin`
- `width`, `height`, `box-sizing: border-box`
- Bordes redondeados `border-radius`
- Sombras `box-shadow` (las tarjetas del proyecto)

**Color y tipografía**
- Colores: nombres, HEX (`#004B91`), `rgb()` y `rgba()`
- Fuentes y `font-family`; importar Google Fonts (Roboto)
- Tamaños, peso (bold), interlineado, `letter-spacing`
- Gradientes lineales (`linear-gradient`) — el banner de cursos

**Maquetación con Flexbox**
- `display: flex`, dirección, `justify-content`, `align-items`
- `gap`, `flex-wrap` y cómo se acomodan las tarjetas en fila
- `flex: 1` para repartir el espacio

**Maquetación con Grid**
- `display: grid`, `grid-template-columns`
- `repeat(auto-fit, minmax(...))` para rejillas responsivas
- Cuándo usar Grid y cuándo Flexbox

**Posicionamiento**
- `static`, `relative`, `absolute`, `fixed` y `sticky`
- `z-index` (capas)
- Ejemplo real: el botón flotante del gato (`position: fixed; bottom; right`)

**Diseño responsivo**
- Unidades `px`, `%`, `em`, `rem`, `vh` y `vw`
- La etiqueta `viewport`
- Media queries (`@media`) para móvil y escritorio
- Imágenes fluidas (`max-width: 100%`)

**Interacción y detalles**
- Transiciones (`transition`) y efectos al pasar el mouse (`hover`)
- Transformaciones (`transform: translateY, scale`)
- Variables CSS (`:root { --color }`)
- Tema claro / oscuro (introducción)

**Práctica (aplicada a TAXLAB 360)**
- Estilizar la cabecera azul y las tarjetas con sombra
- Hacer botones con color, bordes redondeados y efecto hover
- Colocar el widget del gato fijo abajo a la derecha
- Ajustar todo para que se vea bien en celular con una media query

---

## Módulo 3. JavaScript I: lógica y programación básica

> **Objetivo:** aprender a "pensar como programador": variables, decisiones, repeticiones, funciones y datos.
> **Duración:** 3 semanas (12–15 horas)
> **Al terminar:** escribir funciones que calculen y decidan, base para toda la lógica del simulador (importes, validaciones).

**Contenido teórico**

**Primeros pasos**
- Dónde va el JS: `<script>` y archivos `.js` externos (`app.js`, `sol.js`)
- La consola (`console.log`) para depurar
- Comentarios y buenas prácticas de nombres

**Variables y tipos de datos**
- `let`, `const` y `var` (cuál usar y por qué)
- Números, textos (string), booleanos (`true`/`false`), `null` y `undefined`
- Plantillas de texto con backticks: `` `Hola ${nombre}` ``

**Operadores y decisiones**
- Aritméticos (`+`, `-`, `*`, `/`, `%`) y de comparación (`===`, `!==`, `<`, `>`)
- Lógicos (`&&`, `||`, `!`)
- `if` / `else if` / `else`
- Operador ternario y `switch`

**Funciones**
- Declarar funciones, parámetros y `return`
- Funciones flecha (arrow functions)
- Ámbito (scope) de las variables
- Ejemplo real: una función que calcula el IGV de un importe

**Arrays y objetos**
- Arrays (listas): crear, acceder por índice, agregar
- Objetos: propiedades clave-valor (ej. una empresa con `ruc` y `razon_social`)
- Recorrer datos: `for`, `for...of`, `forEach`
- Transformar y filtrar: `map()` y `filter()`

**Práctica (aplicada a TAXLAB 360)**
- Crear un array con las 10 empresas (objetos con `ruc` y razón social)
- Función que reciba un importe y devuelva el IGV (18%)
- Recorrer las empresas y mostrarlas en la consola

---

## Módulo 4. JavaScript II: manipular la página (DOM y eventos)

> **Objetivo:** conectar el JavaScript con el HTML para que la página reaccione a los clics del usuario.
> **Duración:** 3 semanas (12–15 horas)
> **Al terminar:** botones que cambian de pantalla, abren y cierran ventanas (modales), y el interruptor de tema claro/oscuro.

**Contenido teórico**

**¿Qué es el DOM?**
- El árbol de elementos que el navegador crea a partir del HTML
- Cómo JavaScript "ve" y modifica ese árbol

**Seleccionar elementos**
- `document.getElementById()`
- `document.querySelector()` y `querySelectorAll()`
- Recorrer varios elementos encontrados

**Modificar la página**
- Cambiar texto (`textContent`) y HTML (`innerHTML`)
- Cambiar estilos (`style`) y clases (`classList.add/remove/toggle`)
- Mostrar/ocultar elementos
- Crear e insertar elementos nuevos (`createElement`, `appendChild`)

**Eventos**
- `addEventListener` y los eventos `click`, `submit`, `input`, `keydown`
- El objeto del evento y `event.preventDefault()`
- Delegación de eventos (un listener para muchos elementos)

**Formularios con JavaScript**
- Leer valores de inputs (`.value`)
- Validar antes de enviar
- Mostrar mensajes de error al usuario

**Práctica (aplicada a TAXLAB 360)**
- Programar el botón de tema (🌙) que cambia claro/oscuro
- Abrir y cerrar un modal (ventana emergente) como el de acceso
- Cambiar de pantalla al hacer clic en una tarjeta (como la app de dinámica)
- Validar el formulario de Clave SOL con JavaScript

---

## Módulo 5. Guardar información en el navegador

> **Objetivo:** aprender a recordar datos del usuario dentro del navegador, sin base de datos.
> **Duración:** 1 semana (4–6 horas)
> **Al terminar:** entender exactamente cómo el "modo público" de TAXLAB 360 guarda el avance temporal que se borra al cerrar.

**Contenido teórico**

**localStorage y sessionStorage**
- Qué es cada uno y en qué se diferencian
- `localStorage`: persiste aunque cierres el navegador
- `sessionStorage`: se borra al cerrar (lo que usamos para el avance temporal)
- `setItem`, `getItem`, `removeItem`, `clear`

**Trabajar con datos estructurados**
- JSON: qué es y para qué sirve
- `JSON.stringify` (guardar objetos) y `JSON.parse` (recuperarlos)
- Manejo de errores con `try/catch` al leer/escribir

**Organización de las claves**
- Por qué usar "namespaces" (ej. `sim_usuario_ruc_clave`)
- Cómo evitar mezclar datos de distintos usuarios/empresas

**Práctica (aplicada a TAXLAB 360)**
- Guardar la empresa elegida (`sunat_empresa`) en `sessionStorage`
- Recuperarla al abrir otra página del simulador
- Comprobar en DevTools > Application que el dato desaparece al cerrar

---

## Módulo 6. JavaScript III: asincronía y conexión a servidores (APIs)

> **Objetivo:** pedir datos a un servidor mientras la página sigue funcionando, y mostrarlos cuando llegan.
> **Duración:** 2 semanas (8–10 horas)
> **Al terminar:** traer datos reales desde un servidor (como el catálogo de cuentas o las empresas) y pintarlos en pantalla.

**Contenido teórico**

**Qué significa "asíncrono"**
- Por qué la página no se "congela" mientras espera datos
- Callbacks, Promesas (`Promise`) y el problema que resuelven

**async / await**
- Escribir código asíncrono que se lee como si fuera secuencial
- Esperar (`await`) el resultado de una petición
- Capturar errores con `try/catch`

**fetch: pedir datos por HTTP**
- Hacer una petición GET con `fetch()`
- Leer la respuesta en formato JSON
- Estados y errores de red
- Ejemplo real: consultar la cuenta del PCGE por su código

**Práctica (aplicada a TAXLAB 360)**
- Usar `fetch` para traer la descripción de una cuenta contable
- Mostrar "cargando…" mientras llega la respuesta
- Manejar el caso de error (sin conexión)

---

## Módulo 7. Backend con Supabase: bases de datos en la nube

> **Objetivo:** entender cómo se guardan y consultan datos de verdad, y cómo el frontend se conecta de forma segura.
> **Duración:** 3 semanas (12–15 horas)
> **Al terminar:** crear tu propio proyecto en Supabase, tablas con datos y leerlos desde tu página web.

**Contenido teórico**

**Conceptos de base de datos**
- Qué es una base de datos relacional (tablas, filas, columnas)
- Claves primarias y relaciones entre tablas
- Introducción a SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`

**Qué es Supabase**
- PostgreSQL como servicio (base + API automática)
- Crear un proyecto y tablas desde el panel
- El SQL Editor
- La clave anónima (`anon`) y por qué es pública por diseño

**Conectar el frontend**
- Incluir la librería de Supabase (`@supabase/supabase-js`)
- `createClient(url, anonKey)`
- Leer datos: `.from("tabla").select(...)`
- Filtrar: `.eq()`, `.like()`, `.order()`
- Ejemplo real: leer `empresas_simulador`

**Seguridad (muy importante)**
- Por qué `anon` solo debe LEER, nunca escribir libremente
- Row Level Security (RLS): candados por fila (introducción)
- Funciones `fn_*` (SECURITY DEFINER): la vía correcta para escribir
- Nunca poner contraseñas ni datos sensibles en el frontend

**Práctica (aplicada a TAXLAB 360)**
- Crear un proyecto en Supabase y una tabla "empresas"
- Insertar 3 registros de prueba
- Leerlos y mostrarlos en una tabla HTML desde tu página

---

## Módulo 8. Arquitectura del proyecto TAXLAB 360

> **Objetivo:** ver cómo encajan todas las piezas en un proyecto real y por qué se organizó así.
> **Duración:** 2 semanas (8–10 horas)
> **Al terminar:** entender el mapa completo del simulador y poder ubicar dónde tocar cada cosa.

**Contenido teórico**

**Organización de archivos**
- Páginas (`index.html`, `sol.html`, `declaraciones.html`, ...)
- Estilos (`style.css`, `sol.css`, `rvie.css`, ...)
- Lógica (`auth.js`, `sesion.js`, `rvie.js`, ...)
- Módulos independientes en carpetas (`dinamica/`, `plan-contable/`, `taxlab360/`)

**Aplicaciones de una sola página (SPA)**
- Qué es una SPA y cómo se cambian "pantallas" sin recargar
- Diferencia con un sitio multipágina (varias `.html`)
- Cómo el módulo de dinámica usa pantallas ocultas

**Modelo de acceso por capas**
- Puerta 1: usuario y contraseña (quién eres)
- Puerta 2: Clave SOL (con qué empresa trabajas)
- Roles y permisos guardados en la base (no en el código)
- Cómo se hizo el "modo público" sin login (TAXLAB 360)

**Buenas prácticas aplicadas**
- Separar estructura, estilo y lógica
- No "hardcodear" reglas (leerlas de la base)
- Reutilizar componentes (el gatito se inyecta en todas las páginas)
- Comentar solo lo que no es obvio

**Práctica (aplicada a TAXLAB 360)**
- Dibujar el mapa de páginas y cómo enlazan entre sí
- Seguir el recorrido de un clic: portada → SOL → Clave SOL → declaraciones
- Identificar qué archivo controla cada parte

---

## Módulo 9. Git, GitHub y despliegue en Vercel

> **Objetivo:** guardar el historial de tu código, subirlo a la nube y publicarlo en Internet.
> **Duración:** 1 semana (5–7 horas)
> **Al terminar:** tu proyecto publicado en una URL real, con cada cambio versionado y respaldado.

**Contenido teórico**

**Control de versiones con Git**
- Qué es y por qué evita perder trabajo
- Instalar Git y configurar tu nombre y correo
- El flujo: `git status`, `git add`, `git commit`
- Ver el historial: `git log`
- Buenas prácticas para escribir mensajes de commit

**GitHub**
- Qué es un repositorio remoto
- `git push` y `git pull`
- Ramas (branch) e introducción a los Pull Requests

**Despliegue con Vercel**
- Conectar el repositorio de GitHub
- Despliegue automático en cada push
- Cómo quedó `laboratorio-tributario.vercel.app`
- Rutas: `/taxlab360/`, `/plan-contable/`, etc.

**Práctica (aplicada a TAXLAB 360)**
- Inicializar Git en tu proyecto y hacer tu primer commit
- Crear un repositorio en GitHub y subir tu código
- Publicarlo con Vercel y compartir la URL

---

## Módulo 10. Proyecto final integrador

> **Objetivo:** juntar TODO lo aprendido construyendo una versión propia y simplificada de TAXLAB 360.
> **Duración:** 3–4 semanas (15–20 horas)
> **Al terminar:** un mini-simulador funcional, publicado en Internet, hecho por ti de principio a fin.

**Contenido teórico**

**Planificación**
- Definir las pantallas y el flujo
- Bocetar el diseño (wireframe)
- Preparar la base de datos en Supabase

**Construcción paso a paso**
- Maquetar con HTML
- Diseñar con CSS (responsivo)
- Dar lógica con JavaScript (DOM, eventos, storage)
- Conectar datos con Supabase
- Publicar con Git + Vercel

**Cierre**
- Checklist de lo aprendido
- Errores comunes y cómo depurarlos
- Cómo seguir creciendo (frameworks, más SQL, etc.)

**Práctica (entregable)**
- Un módulo educativo propio, funcional y en línea
- Documentar tu proyecto en un README

---

## Anexo A. Glosario esencial

- **HTML:** lenguaje de marcado que define la estructura de una página.
- **CSS:** lenguaje de estilos que define la apariencia (colores, tamaños, posición).
- **JavaScript:** lenguaje de programación que añade comportamiento e interacción.
- **DOM:** representación en árbol de la página que JavaScript puede modificar.
- **API:** interfaz para que dos programas se comuniquen (ej. tu web y Supabase).
- **Frontend:** la parte que ve y usa el usuario (HTML/CSS/JS en el navegador).
- **Backend:** la parte del servidor: base de datos y lógica protegida.
- **Supabase:** servicio que ofrece base de datos PostgreSQL y una API lista para usar.
- **JSON:** formato de texto para intercambiar datos estructurados.
- **sessionStorage:** almacén del navegador que se borra al cerrar la pestaña.
- **localStorage:** almacén del navegador que persiste tras cerrar el navegador.
- **Git:** sistema de control de versiones del código.
- **Repositorio:** carpeta de proyecto versionada con Git (local o en GitHub).
- **Vercel:** plataforma que publica sitios web automáticamente desde GitHub.
- **Responsive:** diseño que se adapta a distintos tamaños de pantalla.

---

## Anexo B. Recursos recomendados

- **MDN Web Docs** (`developer.mozilla.org`): la referencia oficial de HTML, CSS y JS.
- **Documentación de Supabase** (`supabase.com/docs`).
- **Documentación de Git** (`git-scm.com/doc`) y GitHub Docs.
- Practica con las **DevTools** del navegador (tecla F12) en cada página.

---

## Anexo C. Checklist final: "ya sé hacerlo"

- [ ] Crear una página HTML con estructura correcta
- [ ] Estilizar con CSS usando Flexbox, Grid y diseño responsivo
- [ ] Programar interacción con JavaScript (DOM y eventos)
- [ ] Guardar datos con sessionStorage / localStorage
- [ ] Traer datos de un servidor con fetch y async/await
- [ ] Crear tablas en Supabase y leerlas desde la web de forma segura
- [ ] Versionar con Git y publicar en Vercel
- [ ] Construir y desplegar un módulo completo por mi cuenta

---

*TAXLAB 360 — Equipo de Contabilidad CERTUS*
