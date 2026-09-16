# /electric-side/ Go-Live Checklist

**Status**: Pre-producción segura ✅ — arquitectura funcional mergeada (PR #36)
**Última actualización**: 2026-09-16
**Estado actual**: El route está protegido por fail-closed Y ya puede servir la app tras auth exitoso. Falta únicamente configurar credenciales reales para el go-live de Juan.

---

## Corrección de estado (2026-09-16)

Esta sección reemplaza una versión anterior de este documento que decía "PR #32 (arquitecto fix) merged a main" usando un rename de carpeta (`_app-electric-side`) como mecanismo de protección. Ese enfoque era **incorrecto**: se verificó en producción (dos veces, el mismo día) que Vercel sirve cualquier archivo estático físico antes de evaluar `rewrites`/`redirects`, sin excepción — el rename no protegía nada, solo movía la exposición de una ruta a otra. Ver PRs #34 y #35 (hotfixes que cerraron la exposición activa) y #36 (arquitectura definitiva, mergeada).

## Situación Actual (Pre-Producción)

✅ `/electric-side/` retorna **503 Service Unavailable** sin env vars (fail-closed) — verificado en producción
✅ Edge Function valida explícitamente env vars antes de cualquier otra lógica
✅ Rutas públicas (`/presupuesto/`, `/case-study/`, `/`) funcionan normalmente
✅ Endpoints `/api/*` sin afectar
✅ No existe ningún archivo estático físico en `/electric-side/`, `/_app-electric-side/` ni variantes — verificado con curl, 404 en todas
✅ **PR #36 mergeado a main**: el HTML de la app vive embebido en base64 dentro de `sitio/api/protect-electric-side.js` (nunca como archivo estático), con verificación local byte-exacta (503/401/401/200) y revisión de mantenibilidad (tamaño, límites de Vercel, tiempo de respuesta) ya hechas. Falta validar el 200-con-credenciales-reales contra producción una vez que se configuren.

**Credenciales reales**: NO configuradas todavía (Juan empieza mes próximo)

---

## Workflow Go-Live (Próxima Semana)

### 1. Generar Credenciales Seguras

**Usuario (ELECTRIC_SIDE_USER)**:
- Alphanumeric, sin espacios ni caracteres especiales
- Ejemplo: `electric_admin_juan`
- Guardar en ubicación segura (1Password, LastPass, etc.)

**Contraseña (ELECTRIC_SIDE_PASSWORD)**:
- Mínimo 12 caracteres
- Mezcla: MAYÚSCULAS + minúsculas + números + símbolos
- NO usar patrones predecibles o palabras de diccionario
- Ejemplo: `K7$mW!xQ2nF9@pL#`
- Generar con: `openssl rand -base64 16` (luego editar para agregar símbolos)
- Guardar en ubicación segura (NUNCA en WhatsApp, Slack, email sin encripción)

### 2. Configurar en Vercel

1. **Acceder** a https://vercel.com/nawemedia-8661s-projects/nawemedia-web/settings/environment-variables
2. **Agregar env var**: `ELECTRIC_SIDE_USER`
   - Nombre: `ELECTRIC_SIDE_USER`
   - Valor: `[USUARIO_AQUI]`
   - Seleccionar: All Environments ✓
   - Guardar
3. **Agregar env var**: `ELECTRIC_SIDE_PASSWORD`
   - Nombre: `ELECTRIC_SIDE_PASSWORD`
   - Valor: `[CONTRASEÑA_AQUI]`
   - Seleccionar: All Environments ✓
   - Guardar
4. **Redeploy** en https://vercel.com/nawemedia-8661s-projects/nawemedia-web/deployments
   - Click en el último deployment
   - "Redeploy" para activar las nuevas env vars

### 3. Verificar Post-Deploy

```bash
# 1. Sin credenciales → debe retornar 401 (pide usuario:contraseña)
curl -I https://www.nawemedia.com/electric-side/
# Esperado: HTTP/2 401
# Con header: WWW-Authenticate: Basic realm="Electric Side"

# 2. Credenciales inválidas → debe retornar 401
curl -u invaliduser:invalidpass -I https://www.nawemedia.com/electric-side/
# Esperado: HTTP/2 401

# 3. Credenciales correctas → debe retornar 200
curl -u $ELECTRIC_SIDE_USER:$ELECTRIC_SIDE_PASSWORD -I https://www.nawemedia.com/electric-side/
# Esperado: HTTP/2 200
# Con headers:
#   Cache-Control: private, no-cache, no-store, must-revalidate
#   X-Protected-By: basic-auth

# 4. Rutas públicas sin afectar
curl -I https://www.nawemedia.com/presupuesto/
# Esperado: HTTP/2 200 (sin requerir auth)
```

### 4. Comunicar a Juan

**Entregar credenciales de forma segura**:
- ❌ NO: WhatsApp, email sin encripción, Slack
- ✅ SÍ: 1Password shared vault, Apple Keychain, comunicación verbal con apunte en libreta física

**Instrucciones para acceder**:
1. Ir a `https://www.nawemedia.com/electric-side/`
2. Navegador solicita usuario y contraseña
3. Ingresar credenciales
4. Hacer click en "OK" → app carga
5. Los datos quedan en localStorage como antes (sin persistencia backend)
6. Al cerrar navegador y volver a entrar: vuelve a pedir credenciales (stateless)

**Sobre la sesión**:
- Cada refresh → pide credenciales de nuevo (diseño stateless)
- Navegador puede guardar credenciales (opción "Guardar contraseña")
- En dispositivos compartidos: limpiar datos del navegador para forzar re-auth

---

## Cambios de Configuración (Documentar en Vercel)

Crear una nota en Vercel project settings con:

```
/electric-side/ Go-Live Configuration
--------------------------------------
Deployment Date: [insertar fecha]
Credentials set by: [insertar nombre]
Contact for credential rotation: [email]

Security properties:
- Basic HTTP Auth required (fail-closed without env vars)
- Private cache headers prevent shared proxy caching
- Stateless design: each request must include credentials
- No session tokens or backend persistence

Next steps (P1):
- Implement session management with JWT tokens
- Add audit logging (who accessed when)
- Rate limiting against brute force
- Migrate to Supabase backend with row-level security
```

---

## Rotación Futura de Credenciales

**Cuándo rotar**:
- Cada 90 días (recomendación de seguridad)
- Si se sospecha compromiso
- Si Juan se va del equipo

**Cómo rotar**:
1. Generar nuevas credenciales (ver paso 1 arriba)
2. Actualizar env vars en Vercel
3. Redeploy automático
4. Viejo usuario:contraseña deja de funcionar inmediatamente

---

## Troubleshooting

| Problema | Posible Causa | Solución |
|----------|---------------|----------|
| Retorna 503 | ELECTRIC_SIDE_USER o ELECTRIC_SIDE_PASSWORD no configurada | Ir a Vercel env vars, verificar nombres exactos, redeploy |
| Retorna 401 even con credenciales | Credenciales inválidas | Verificar usuario:contraseña exactos en Vercel |
| Retorna 200 pero app vacía | `localStorage` sin datos previos | App espera datos guardados previamente; validar import/backup |
| Auth en navegador pero pide de nuevo cada refresh | Diseño intencional | Esto es correcto: stateless auth, no session tokens |
| Otras rutas retornan 503 | Rewrite incorrecta | Verificar vercel.json: rewrites solo para /electric-side/* |

---

## Files de Referencia

- `sitio/api/protect-electric-side.js` - Edge Function con fail-closed logic + HTML embebido en base64 (PR #36)
- `tools/electric-side/source.html` - Fuente editable del HTML de la app (fuera del árbol que Vercel deploya)
- `tools/electric-side/build.mjs` - Regenera el bloque base64 desde source.html; correr después de cualquier cambio al contenido de la app. Nunca editar el base64 a mano.
- `sitio/vercel.json` - Rewrites para /electric-side/*
- `ELECTRIC_SIDE_P0_SECURITY.md` - Documentación técnica completa
- Este documento - Workflow go-live y checklist

**Requisito de orden**: PR #36 ya está mergeado a main — la función tiene contenido que servir tras un login exitoso. El paso 2 (Configurar en Vercel) queda habilitado, pero las credenciales reales se configuran recién cuando se decida el go-live real de Juan, no antes.

---

## Estado P0 → P1

**P0 (Completado)**:
- ✅ Basic Auth protection en /electric-side/
- ✅ Fail-closed sin env vars (503)
- ✅ Rutas públicas intactas

**P1 (siguiente bloque después de mergear PR #36 — prioridad, no opcional)**:
- **Export/import backup JSON**: sin esto, Juan puede perder todo el trabajo con solo borrar datos del navegador o cambiar de dispositivo, aunque la seguridad esté perfecta. Es el riesgo real más urgente después de cerrar el P0.
- Migrar backend a Supabase con persistent auth (JWT)
- Row-level security (RLS) policies
- Database backups
- Audit logging (quién accedió cuándo)
- User management dashboard
- Rate limiting contra brute force
- Session timeout & re-auth challenge

**P2 (Long-term)**:
- Agregar export/import JSON para backups de datos
- Validación cross-device (prevenir compartir cuentas)
- Integración con CUIT/CBU validation API

---

**Nota Final**: Juan todavía NO usa `/electric-side/`. Empieza mes próximo. Estado actual: seguro, en pre-producción, esperando credenciales reales.
