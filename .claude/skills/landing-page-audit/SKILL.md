---
name: landing-page-audit
description: Auditar y mejorar una landing page o sitio web existente con criterio real en vez de plantilla genérica — performance (contenido embebido en base64, imágenes sin optimizar), copy centrado en el negocio real, uso de fotos/assets reales ya existentes en el repo, accesibilidad básica y CTAs de conversión (mailto vs formulario real a una base de datos). Usar SIEMPRE que el usuario pida "auditar", "mejorar", "hacer más premium/profesional" un sitio o landing existente, cuando traiga prompts genéricos de "dirección creativa" tipo plantilla (director creativo galardonado, tecnólogo de élite, diseñador de movimiento) para evaluarlos o aplicarlos, o cuando pregunte por qué su sitio "no se siente premium" o "no convierte". NO es para crear un sitio nuevo desde cero sin nada existente que auditar — para eso el sitio ya tiene que existir con al menos un archivo real para leer.
---

# Auditoría y mejora de landing pages

Metodología para auditar un sitio/landing existente y aplicar mejoras reales,
en vez de una ronda de "dirección creativa premium" genérica. Nació de una
sesión real donde el usuario trajo 7 prompts tipo plantilla ("actuá como
director creativo galardonado", "tecnólogo creativo de élite", etc.) para
rediseñar una landing B2B — la mejora real no vino de esos prompts, vino de
leer el archivo, medir su peso real, y encontrar fotos que el propio usuario
ya tenía subidas y nadie usaba.

Es agnóstica de stack: aplica igual a un HTML de un solo archivo sin build
step que a un proyecto con framework — donde el ejemplo mencione un backend
propio o una plataforma de deploy, es solo eso, un ejemplo; identificá el
patrón real del proyecto en el que estés antes de asumir nada.

## Paso 0: si te traen un prompt de "dirección creativa premium" genérico

Si el usuario trae prompts tipo "actuá como director creativo galardonado/
tecnólogo de élite/diseñador de movimiento de clase mundial" (son un patrón
reconocible, circulan mucho), decile lo que son antes de ejecutarlos tal
cual:

- Son genéricos — no conocen el negocio real. Un negocio B2B serio (o
  cualquiera cuyo público no sea "consumidor final navegando por placer")
  no necesariamente necesita cursor 3D ni parallax — necesita claridad y
  prueba de que el servicio funciona. Antes de aplicar cualquier prompt de
  estilo, preguntate quién mira este sitio y qué necesita ver para confiar.
- Pueden meter un framework/build step por la ventana sin que el usuario lo
  pida. Prompts que piden "arquitectura, componentes, elementos 3D" empujan
  hacia React/Three.js/bundlers. Si el proyecto es de archivos estáticos
  sin build step, un prompt así tarde o temprano va a sugerir migrar —
  cuidado con eso si no es lo que se pidió.
- Están pensados para iterar sobre capturas de un sitio ya construido
  (2 de los 7 prompts típicos dicen literalmente "analizá screenshots"),
  no para partir de cero. Usados en orden, generan varias rondas de texto
  antes de tocar una sola línea de código.

Lo que sí vale la pena rescatar de la idea de fondo: una auditoría real
sobre el sitio actual. Ofrecé hacer eso — con el contexto real del negocio,
no la plantilla — en vez de tirar el prompt tal cual.

## Paso 1: auditar leyendo el archivo real

No opines sobre tipografía/espaciado/paleta en abstracto. Leé el archivo
completo (o los archivos relevantes: HTML/CSS/JS del sitio, y si el archivo
es grande, en partes — cuidado con líneas gigantes de base64, ver Paso 2).
Antes de dar cualquier hallazgo, entendé:

- Qué vende el sitio y a quién — B2B/B2C, quién decide, qué le importa a
  esa persona (confianza y prueba operativa pesan más que espectáculo
  visual para un comprador B2B; para un producto de consumo puede ser al
  revés).
- Qué stack usa de verdad — build step o no, qué CDN/librerías ya carga,
  qué convención de assets ya existe (dónde viven las imágenes, si hay
  carpetas de diseño con logos oficiales, etc.). No proponer nada que
  contradiga la arquitectura real sin que te lo pidan explícitamente.
- Si ya tuvo una ronda previa de "hacerlo premium" — un sitio puede ya
  tener animaciones cuidadas (reveal on scroll, tilt, spotlight) y lo que
  falte no sea más movimiento sino contenido real o copy mejor. Revisá el
  CSS/JS existente antes de asumir que "hace falta agregar interactividad".

Devolvé una lista priorizada por impacto real, con referencia a archivo y
línea, no una lista genérica de "mejorá la tipografía, el spacing, la
jerarquía". Separá qué es crítico (afecta carga o conversión) de qué es
pulido menor, y decí también qué NO tocarías porque ya está bien resuelto
— eso le da crédito a la auditoría.

## Paso 2: contenido embebido en base64 — el hallazgo de performance más común

Grepeá el archivo por `data:image` y `data:text/html;base64` (o el
equivalente del stack: cualquier asset pesado embebido inline en vez de
servido por URL). Es sorprendentemente común encontrar un logo o un iframe
de demo embebido así, inflando el documento principal en cientos de KB que
se descargan antes de poder pintar nada.

Para cada uno encontrado:

1. Decodificalo a un archivo temporal y medí su peso real y dimensiones.
2. Si es una imagen mostrada a un tamaño fijo en pantalla (ej. un logo de
   26px de alto en el nav), no la sirvas al tamaño del archivo de diseño
   original — redimensioná al tamaño real de despliegue considerando
   pantallas retina (2x-3x el tamaño mostrado alcanza y sobra, no hace
   falta más).
3. Comprimí: JPEG con calidad ~78-80 para fotos, paleta indexada (256 o
   menos colores) para PNG con pocos colores sólidos (logos, íconos,
   ilustraciones planas) — probá primero con 256 colores y compará
   visualmente contra el original antes de bajar más; para fotos con
   degradados no cuantices, quedate en JPEG.
4. Guardalo como archivo estático real (con nombre descriptivo, no el hash
   que traía) y reemplazá el `data:...base64,...` por una referencia de
   `src` normal. Si es un iframe con HTML completo, extraelo a su propio
   `.html` servido aparte.
5. Verificá visualmente el resultado (no asumas que "se comprimió bien" —
   mostralo, aunque sea a vos mismo, antes de dar por buena la compresión).

Este solo paso suele bajar el documento principal 70-90%. Es la mejora de
mayor impacto por menor esfuerzo de toda esta skill — hacela primero.

## Paso 3: buscá fotos/assets reales antes de usar placeholders

Antes de dejar (o inventar) un placeholder de degradé/ilustración genérica
donde debería haber una foto real, buscá en todo el repo — no solo en la
carpeta obvia. Es común encontrar carpetas de fotos reales del negocio
(operación, equipo, producto) subidas en algún momento y nunca usadas en el
sitio, o assets de diseño (logos, renders de producto en distintos ángulos)
guardados para otro propósito (una propuesta comercial, un mockup) que
sirven perfecto acá también.

- Generá una hoja de contacto (grid de miniaturas con índice) en vez de
  mirar imagen por imagen una por una — mucho más rápido para elegir.
- Preferí fotos que ya cuenten algo por sí solas (con un título/contexto
  visible, si vienen de redes sociales por ejemplo) por sobre fotos que
  necesiten texto superpuesto agregado por vos.
- Optimizá cada una igual que en el Paso 2 antes de subirla al sitio —
  una foto de celular puede pesar varios MB sin ninguna necesidad.
- Si de verdad no hay ningún asset real disponible, decilo — no inventes
  una foto ni la description de una que no existe.

## Paso 4: copy centrado en el negocio real

Un lead/subtítulo genérico ("Todo lo que necesitás en una sola app") no
dice nada que el visitante no sepa ya. Reescribilo para nombrar el
diferencial real del negocio — algo que ya esté probado en el resto del
sitio (stats, testimonios, características) pero que el copy principal no
esté aprovechando.

Revisá también los CTAs de conversión repetidos por el sitio (nav, hero,
sección final, etc.) — es común que cada aparición tenga un texto distinto
para la misma acción de fondo ("Quiero conocer el servicio", "Solicitar
propuesta", "Enviar un email"). Unificalos a un solo texto/verbo: repetir
el mismo CTA ayuda a que el visitante lo reconozca la segunda vez que lo
ve, en vez de tener que evaluar cada uno como si fuera distinto.

## Paso 5: accesibilidad básica de íconos decorativos

Si un ícono (emoji o SVG) es puramente decorativo y el texto de al lado ya
da el contexto real (un `<h4>` de título junto a un emoji de tarjeta, por
ejemplo), marcalo `aria-hidden="true"` — sin eso, un lector de pantalla lo
anuncia por su nombre literal ("round pushpin"), que es ruido, no
información. No hace falta sacar el ícono visual, solo ocultarlo del árbol
de accesibilidad.

No es necesario armar una auditoría de accesibilidad completa salvo que te
la pidan — este es el hallazgo de accesibilidad más común y de menor
esfuerzo en una landing con íconos-emoji, no un reemplazo de una auditoría
WCAG real.

## Paso 6: CTA de conversión — mailto vs. formulario real

Un CTA de conversión que es solo un link `mailto:` tiene dos problemas: no
queda ningún registro si el visitante no tiene cliente de correo
configurado o el mail se pierde, y no deja ningún dato estructurado más
allá del click en analytics.

Antes de proponer reemplazarlo por un formulario que inserte en una base
de datos propia, primero avisá en una línea qué implica (normalmente:
una tabla/colección nueva con su propia política de acceso) y esperá
confirmación si el proyecto trata cambios de datos/permisos como algo
sensible — no asumas que está bien tocarlo sin avisar.

Si procedés:

- Replicá el patrón de acceso que el propio proyecto ya usa para otros
  formularios públicos, si existe uno (inserción anónima acotada a los
  campos que el visitante puede llenar, lectura restringida a quien
  gestiona el negocio) — no inventes un esquema de permisos nuevo si ya
  hay uno establecido.
- Pensá quién tiene derecho a leer ese dato. Un lead comercial es un dato
  interno del negocio — si el proyecto ya tiene roles de "cliente" o
  "tercero" con acceso a otras partes del sistema, ese rol normalmente NO
  debería poder leer leads comerciales de otros prospectos. Esto es un
  error real y repetible: copiar la lista de roles de una tabla vecina sin
  preguntarse si el dato nuevo es algo que ese rol tiene derecho a ver.
- Si todavía no existe ningún panel/lugar donde alguien vaya a leer esos
  datos nuevos, no lo dejes como un agujero negro silencioso: mientras no
  exista ese panel, hacé que el formulario además dispare el mecanismo de
  aviso que ya existía (el mailto, por ejemplo, con los datos precargados)
  para no perder el aviso inmediato. Decíselo al usuario explícitamente:
  esto es un parche razonable, no la solución final — un panel de lectura
  real es una mejora pendiente, no algo que hayas resuelto.
- Verificá el acceso real, no solo la política tal como quedó escrita:
  probá con una request real (con y sin credenciales de "quien gestiona el
  negocio") que la escritura pública funciona y que la lectura sin
  credenciales no devuelve nada. Borrá cualquier dato de prueba que hayas
  creado apenas termines de verificar.

## Paso 7: verificación end-to-end real, con las trampas ya conocidas

"Se ve bien en el código" no es verificación. Si tenés forma de renderizar
el sitio de verdad (headless browser), hacelo — pero conocé estas trampas
antes de leer un resultado como bug:

- **`loading="lazy"` + screenshot de página completa da falso negativo.**
  Si tomás una captura de la página entera sin haber hecho scroll real por
  ella, las imágenes con carga diferida pueden aparecer vacías aunque
  estén perfectamente bien — el navegador headless no siempre dispara la
  carga diferida solo por expandir el viewport para la captura. Antes de
  reportar "esta sección no carga", confirmá con scroll real (progresivo,
  no solo saltar al final) o, más confiable, consultando el DOM
  directamente (`complete`/`naturalWidth` de cada imagen, sin errores de
  red) — eso te dice si el contenido realmente cargó, independiente de
  cómo salió la foto.
- **Las animaciones de entrada (reveal on scroll) pueden esconder
  contenido que sí está bien.** Si el sitio anima elementos a aparecer
  cuando entran en pantalla, una captura de página completa sin scroll
  real deja fuera de cámara — y por lo tanto sin disparar — todo lo que
  nunca "entró" al viewport durante la sesión. Para revisar contenido sin
  ese ruido, emulá `prefers-reduced-motion: reduce` (si el sitio respeta
  esa media query, como corresponde) y volvé a capturar — así ves todo el
  contenido real, estático y completo.
- **No dependas de que la red externa real funcione dentro del navegador
  de prueba** si estás en un entorno con políticas de red restringidas
  (sandbox, CI). Para probar un flujo que llama a un servicio externo
  (una API, una base de datos), interceptá esa request específica en el
  navegador para inspeccionar qué se envía (el payload, los headers) sin
  depender de que la llamada real llegue a destino — y verificá la
  llamada real por separado, con una herramienta que sí tenga acceso
  confiable a esa red (línea de comando, por ejemplo), no las dos cosas
  a la vez en el mismo test.

## Paso 8: antes de tocar datos o infraestructura, avisá

Cualquier cambio que toque un esquema de datos, permisos/políticas de
acceso, o borre algo, decilo en una línea antes de ejecutarlo y esperá
confirmación — incluso si el resto de esta skill te autoriza a proceder
sin preguntar en todo lo demás. El costo de pausar a confirmar es bajo; el
costo de un cambio de permisos mal pensado en datos reales no lo es.

## Paso 9: flujo de deploy disciplinado

No des una mejora por terminada al guardar el archivo. El ciclo completo:

1. Si el archivo no tiene build step ni linter, verificá al menos que
   quedó bien formado (en HTML: balance de tags) antes de commitear —
   es fácil dejar algo roto editando un archivo grande a mano.
2. Commit con mensaje que explique el porqué del cambio, no solo el qué.
3. Publicalo siguiendo el flujo real del proyecto (PR + merge, o el que
   corresponda) — no inventes un atajo.
4. Verificá que el build/deploy resultante haya quedado listo antes de
   decir que está en vivo.
5. Confirmá el contenido real y en vivo (pedile al sitio publicado el
   contenido nuevo, no asumas que porque el deploy terminó ya se ve) antes
   de reportar la tarea como terminada.

## Qué modelo usar para este tipo de tarea

Este trabajo es HTML/CSS/JS (o el front-end equivalente del stack) y copy
— no requiere razonamiento profundo de arquitectura de sistemas. Un modelo
intermedio/estándar alcanza de sobra; no hace falta escalar a un modelo
más caro salvo que, después de ver el resultado, el criterio creativo o de
copy no convenza — ahí sí vale la pena probar con uno más potente, pero no
antes de tener un resultado concreto para juzgar.
