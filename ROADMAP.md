# 🗺️ Roadmap - Terapia a Tu Lado

Este documento describe el progreso actual y la visión futura del proyecto **Terapia a Tu Lado**.

---

## 📊 Estado Actual del Proyecto

**Versión**: 0.0.0 (Beta inicial)  
**Última actualización**: 2026-02-02

### ✅ Funcionalidades Implementadas

#### Core Features (MVP) ✓
- [x] Sistema de autenticación con Supabase
- [x] Perfiles de usuario personalizados (nombre, edad)
- [x] Chat terapéutico con IA en tiempo real
- [x] Streaming de respuestas de IA
- [x] Persistencia de conversaciones en base de datos
- [x] Historial de chat por día
- [x] Límite de 3 conversaciones diarias

#### Análisis y Métricas ✓
- [x] Análisis automático de emociones (trigger en mensaje #3)
- [x] Detección de 5 emociones: ansiedad, enojo, tristeza, estabilidad, alegría
- [x] Identificación de disparadores principales
- [x] Análisis de creencias centrales
- [x] Tracking de evolución emocional
- [x] Dashboard de estadísticas emocionales

#### Sistema de Progreso ✓
- [x] Planta virtual que crece con el progreso
- [x] 4 etapas de crecimiento (semilla → brote → planta → florecimiento)
- [x] Sistema de racha de días consecutivos
- [x] Contador de sesiones totales
- [x] Visualización de logros

#### Sugerencias Personalizadas ✓
- [x] Generación automática de 3 sugerencias diarias
- [x] Categorización (reflexión, acción, autocuidado)
- [x] Sistema de confirmación con notas
- [x] Tracking de sugerencias completadas
- [x] Persistencia en base de datos

#### UX/UI ✓
- [x] Diseño responsive (móvil y escritorio)
- [x] Sidebar colapsable con navegación
- [x] Animaciones suaves con Framer Motion
- [x] Gradientes y paleta de colores cálidos
- [x] Modo claro optimizado
- [x] Componentes accesibles (Radix UI + shadcn)

#### Infraestructura ✓
- [x] Edge Functions de Supabase para IA
- [x] Row Level Security (RLS) completo
- [x] Migraciones de base de datos
- [x] Variables de entorno configuradas
- [x] Testing setup (Vitest + Testing Library)
- [x] Linting (ESLint + TypeScript)

---

## 🚀 Próximas Fases

### Fase 1: Mejoras Core (Próximos 1-2 meses)

#### Prioridad Alta 🔴
- [x] **Modo oscuro completo**
  - Implementar tema oscuro con next-themes
  - Toggle de tema en configuración
  - Ajustar gradientes para dark mode

- [x] 📅 Mejora del sistema de rachas: Implementar un calendario visual de progreso y recompensas por rachas largas (7, 14, 30 días)
  - Visualización de calendario de rachas

- [ ] **Exportación de datos**
  - Exportar conversaciones a PDF
  - Exportar análisis emocional
  - Dashboard de progreso descargable

- [ ] **Mejora de notificaciones**
  - Recordatorios diarios (si el usuario lo desea)
  - Notificación cuando se generan sugerencias
  - Celebración de logros

#### Prioridad Media 🟡
- [ ] **Onboarding mejorado**
  - Tutorial interactivo para nuevos usuarios
  - Explicación de cómo funciona el análisis
  - Tips sobre cómo usar mejor la app

- [x] **Configuración de usuario**
  - Editar perfil (nombre, edad)
  - Preferencias de notificaciones
  - Configuración de privacidad
  - Eliminar cuenta

- [ ] **Mejora de visualizaciones**
  - Gráficos de tendencias (semana/mes)
  - Comparación de emociones en el tiempo
  - Heatmap de emociones por día

#### Prioridad Baja 🟢
- [ ] **Mejora de accesibilidad**
  - Soporte completo para lectores de pantalla
  - Navegación por teclado mejorada
  - Alto contraste opcional

- [ ] **Internacionalización (i18n)**
  - Soporte para inglés
  - Sistema de traducción con i18next
  - Detección automática de idioma

---

### Fase 2: Features Avanzadas (2-4 meses)

#### Análisis Profundo 📊
- [ ] **Historial de análisis emocional**
  - Ver análisis de sesiones pasadas
  - Comparación de análisis
  - Evolución de patrones en el tiempo

- [ ] **Insights con IA mejorados**
  - Resúmenes semanales automáticos
  - Detección de tendencias a largo plazo
  - Alertas de cambios significativos

- [ ] **Journal personal**
  - Espacio para escritura libre
  - Análisis de journal con IA
  - Integración con chat terapéutico

#### Gamificación Expandida 🎮
- [ ] **Sistema de logros**
  - Badges por milestones (primera semana, primer mes, etc.)
  - Logros especiales (completar todas las sugerencias del día)
  - Colección de logros en perfil

- [ ] **Avatares personalizables**
  - Personalización de la planta
  - Decoraciones desbloqueables
  - Diferentes especies de plantas

- [ ] **Desafíos semanales**
  - Retos de autocuidado
  - Metas personalizadas
  - Recompensas por completarlos

#### Social (Opcional) 👥
- [ ] **Comunidad anónima (con moderación)**
  - Compartir logros (sin detalles personales)
  - Apoyo mutuo anónimo
  - Grupos de interés (ansiedad, mindfulness, etc.)

---

### Fase 3: Escalabilidad & Monetización (4-6 meses)

#### Features Premium 💎
- [ ] **Plan Premium**
  - Conversaciones ilimitadas
  - Análisis detallados avanzados
  - Recomendaciones personalizadas con más profundidad
  - Exportación premium con insights visuales

- [ ] **Sesiones con terapeutas reales**
  - Integración con red de terapeutas
  - Booking de sesiones desde la app
  - Transición de IA → profesional

- [ ] **Programas guiados**
  - Cursos de mindfulness
  - Programas de manejo de ansiedad
  - Rutas de autoconocimiento

#### Infraestructura 🏗️
- [ ] **Optimización de performance**
  - Code splitting avanzado
  - Lazy loading de componentes pesados
  - Optimización de queries de Supabase
  - CDN para assets estáticos

- [ ] **Monitoreo y Analytics**
  - Error tracking (Sentry)
  - Analytics de uso (PostHog o similar)
  - Métricas de rendimiento
  - A/B testing framework

- [ ] **Sistema de backups**
  - Backups automáticos diarios
  - Restore de datos de usuario
  - Redundancia geográfica

#### Mobile 📱
- [ ] **Progressive Web App (PWA)**
  - Service workers para offline
  - Instalable en móvil
  - Push notifications

- [ ] **App nativa (React Native)**
  - iOS y Android
  - Sincronización con versión web
  - Notificaciones push nativas

---

## 🔧 Mejoras Técnicas Continuas

### Code Quality
- [ ] Aumentar cobertura de tests a >80%
- [ ] Implementar E2E tests con Playwright
- [ ] Mejorar documentación de código
- [x] Refactorizar `TherapyApp.tsx` (muy largo)

### DevOps
- [ ] CI/CD pipeline con GitHub Actions
- [ ] Preview deployments automáticos
- [ ] Testing automático en PRs
- [ ] Semantic versioning automático

### Seguridad
- [ ] Auditoría de seguridad profesional
- [ ] Rate limiting en Edge Functions
- [ ] CAPTCHA para registro
- [ ] Sanitización mejorada de inputs

---

## 📈 KPIs y Métricas de Éxito

### Métricas Actuales a Trackear
- **DAU/MAU** (Daily/Monthly Active Users)
- **Retención**: % de usuarios que vuelven después de 7/30 días
- **Engagement**: Conversaciones promedio por usuario
- **Completitud**: % de sugerencias completadas
- **Rachas**: Promedio de días consecutivos

### Objetivos para 6 meses
- [ ] 100+ usuarios activos
- [ ] 60% retención a 7 días
- [ ] 2.5 conversaciones promedio por usuario
- [ ] 70% de sugerencias completadas
- [ ] Racha promedio de 5 días

---

## 🐛 Bugs Conocidos y Tech Debt

### Bugs Menores
- [ ] Scroll automático a veces no funciona correctamente
- [ ] Animación de planta puede lag en móviles antiguos
- [ ] Edge case: si el usuario tiene >100 mensajes, la UI puede ser lenta

### Tech Debt
- [x] `TherapyApp.tsx` es muy grande (742 líneas → separar en hooks)
- [ ] Mejorar manejo de errores en Edge Functions
- [ ] Centralizar constantes mágicas (ej: límite de 3 conversaciones)
- [ ] Tipado más estricto en algunas interfaces

---

## 💡 Ideas Futuras (Backlog)

### Short-term Ideas
- Playlist de música relajante integrada
- Ejercicios de respiración guiados
- Recordatorios de hidratación/pausas
- Modo "Crisis" con recursos de emergencia

### Long-term Ideas
- Integración con wearables (Fitbit, Apple Watch)
- Análisis de voz (tono emocional)
- IA multimodal (imágenes, grabaciones de voz)
- Chatbot por WhatsApp/Telegram
- Integración con calendario (agendar autocuidado)

### Research & Exploration
- Uso de modelos de IA especializados en salud mental
- Colaboración con instituciones de salud mental
- Estudios de eficacia con universidades
- Open-sourcing de componentes (anonimizados)

---

## 🎯 Visión a Largo Plazo

**Terapia a Tu Lado** aspira a ser:

1. 🌍 **Accesible globalmente**: Traducido a múltiples idiomas, accesible para todos
2. 🤝 **Complemento a terapia profesional**: Puente entre autoayuda y terapia formal
3. 📊 **Basado en evidencia**: Validado con estudios científicos de salud mental
4. 🔒 **Privado y seguro**: Estándar de oro en protección de datos sensibles
5. 💚 **Impacto social**: Reducir barreras de acceso a apoyo emocional

---

## 📝 Cómo Contribuir al Roadmap

Si tienes ideas o quieres proponer cambios:

1. Abre un **Issue** en GitHub con la etiqueta `enhancement`
2. Describe claramente el problema que resuelve tu idea
3. Proporciona mockups o ejemplos si es posible
4. Discute con el equipo en los comentarios

---

## 📅 Timeline Visual

```
2026 Q1 (Actual)
├─ ✅ MVP completado
├─ ✅ Core features implementados
└─ 🔄 Beta testing inicial

2026 Q2
├─ 🎯 Modo oscuro
├─ 🎯 Mejoras de UX
├─ 🎯 Sistema de rachas mejorado
└─ 🎯 Exportación de datos

2026 Q3
├─ 📊 Análisis avanzados
├─ 🎮 Gamificación expandida
├─ 📱 PWA
└─ 🧪 A/B testing

2026 Q4
├─ 💎 Plan Premium
├─ 🏗️ Optimización
├─ 📱 App móvil nativa
└─ 🌍 i18n completo

2027+
├─ 🤝 Red de terapeutas
├─ 🌐 Comunidad global
└─ 📈 Escalamiento internacional
```

---

## ✅ Criterios de Completitud

Cada feature se considera completa cuando cumple:

- [ ] **Implementada** y funcional en dev
- [ ] **Testeada** con tests automatizados
- [ ] **Documentada** en código y en AGENT.md
- [ ] **Revisada** por al menos 1 persona
- [ ] **Deployed** en producción
- [ ] **Monitoreada** con métricas básicas

---

## 🙏 Agradecimientos

Gracias a todos los que contribuyen a hacer el bienestar emocional más accesible. Cada línea de código es un paso hacia un mundo con mejor salud mental.

---

*Última actualización: 2026-02-02*  
*Este roadmap es un documento vivo y se actualiza regularmente.*
