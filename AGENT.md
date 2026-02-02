# 🤖 Guía para Agentes IA - Terapia a Tu Lado

Este documento proporciona contexto y directrices para agentes de IA que trabajen en el proyecto **Terapia a Tu Lado**.

## 📋 Descripción del Proyecto

**Terapia a Tu Lado** es una aplicación web de acompañamiento emocional que combina:
- Chat terapéutico con IA (streaming en tiempo real)
- Análisis automático de emociones y patrones
- Sistema gamificado de progreso (planta virtual)
- Sugerencias personalizadas diarias
- Dashboard de métricas emocionales

## 🎯 Objetivo Principal

Brindar apoyo emocional accesible y personalizado mediante IA, ayudando a los usuarios a:
- Comprender sus patrones emocionales
- Obtener insights sobre sus estados mentales
- Desarrollar hábitos de autocuidado
- Hacer seguimiento de su progreso personal

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Framer Motion (animaciones)
- React Router DOM

**Backend:**
- Supabase (BaaS)
  - PostgreSQL database
  - Auth (autenticación)
  - Edge Functions (lógica del servidor)
  - Row Level Security (RLS)

**Estado y Data Fetching:**
- TanStack Query (React Query)
- React Hook Form + Zod (formularios)

### Componentes Principales

1. **`TherapyApp.tsx`** (742 líneas)
   - Componente central de la aplicación
   - Gestiona estado del chat, análisis y sugerencias
   - Maneja sidebar, navegación y tabs
   - Implementa lógica de límite diario (3 conversaciones)

2. **`AuthPage.tsx`**
   - Autenticación de usuarios
   - Integración con Supabase Auth

3. **Dashboard Components** (`src/components/dashboard/`)
   - `EmotionStats.tsx` - Gráficos de emociones
   - `PatternAnalysis.tsx` - Análisis de patrones
   - `DailySuggestions.tsx` - Sugerencias y confirmaciones
   - `PlantProgress.tsx` - Sistema de planta virtual

4. **Chat Components** (`src/components/chat/`)
   - `ChatMessage.tsx` - Renderizado de mensajes
   - `ChatInput.tsx` - Input para mensajes
   - `TypingIndicator.tsx` - Indicador de escritura

### Base de Datos (Supabase)

**Tablas principales:**

```sql
profiles
├── user_id (PK, FK to auth.users)
├── name
├── age
├── is_moderator
├── streak_days
└── total_sessions

chat_messages
├── id (PK)
├── user_id (FK)
├── role (user|assistant)
├── content
├── session_date
└── created_at

daily_suggestions
├── id (PK)
├── user_id (FK)
├── suggestion_text
├── category
├── is_completed
├── completed_at
├── notes
└── confirmed

emotion_analyses
├── id (PK)
├── user_id (FK)
├── anxiety, anger, sadness, stability, joy
├── main_trigger
├── core_belief
└── evolution
```

## 🔄 Flujo de Trabajo Principal

### 1. Autenticación
```
Usuario → AuthPage → Supabase Auth → Profile creado/cargado → TherapyApp
```

### 2. Chat Terapéutico
```
Usuario escribe mensaje
  ↓
Se guarda en chat_messages
  ↓
Se envía a Edge Function (therapy-chat)
  ↓
IA genera respuesta (streaming)
  ↓
Respuesta se muestra en tiempo real
  ↓
Se guarda respuesta en chat_messages
  ↓
messageCount++
```

### 3. Análisis Automático (trigger: mensaje #3)
```
messageCount === 3
  ↓
Llamadas paralelas a Edge Functions:
  - analyze_emotions → emotionData
  - generate_suggestions → suggestions
  ↓
Se guarda en:
  - emotion_analyses (análisis)
  - daily_suggestions (sugerencias)
  ↓
Dashboard se actualiza
```

### 4. Sistema de Planta
```
Usuario completa sugerencias (con notas)
  ↓
confirmedSuggestions++
  ↓
Planta crece según nivel:
  - 0: Semilla
  - 1-2: Brote
  - 3-5: Planta
  - 6+: Florecimiento
```

## 📝 Reglas de Negocio Importantes

### Límites y Restricciones
- ✅ **Máximo 3 conversaciones diarias** por usuario
- ✅ **Análisis automático** se ejecuta solo en el mensaje #3
- ✅ **Confirmación de sugerencias** requiere notas del usuario
- ✅ **Moderadores** tienen acceso a reset de chat para pruebas

### Personalización
- El chat incluye contexto del usuario (nombre, edad, total de conversaciones)
- Las sugerencias se generan basadas en el historial completo
- El análisis emocional usa todo el contexto de la conversación

### Persistencia
- Todo se guarda en Supabase en tiempo real
- Al cargar la app, se recupera el historial del día actual
- Las rachas se calculan por días consecutivos de uso

## 🎨 Convenciones de Código

### TypeScript
- Usa interfaces para tipos complejos (`Message`, `EmotionData`, etc.)
- Tipado estricto activado
- No usar `any` a menos que sea absolutamente necesario

### Componentes React
- Functional components con hooks
- `useCallback` para funciones que se pasan como props
- `useMemo` para computaciones costosas
- Desestructuración de props

### Estilos
- Tailwind CSS utility-first
- Clases personalizadas en `index.css` (gradients, animations)
- Usa `cn()` de `lib/utils` para combinación condicional de clases
- Prefiere componentes de shadcn/ui sobre código custom

### Naming Conventions
- Componentes: PascalCase (`TherapyApp.tsx`)
- Funciones: camelCase (`sendMessage`, `handleLogout`)
- Constantes: UPPER_SNAKE_CASE (raramente usado)
- Archivos: PascalCase para componentes, camelCase para utils

## 🔧 Tareas Comunes

### Agregar un nuevo componente de UI

```bash
npx shadcn-ui@latest add [component-name]
```

### Crear una nueva tabla en Supabase

1. Crear migración SQL en `supabase/migrations/`
2. Incluir políticas RLS
3. Aplicar migración en Supabase Dashboard
4. Actualizar tipos TypeScript

### Modificar el análisis de IA

Editar Edge Function en `supabase/functions/therapy-chat/`:
- Ajustar prompts del sistema
- Modificar parsing de respuestas
- Actualizar tipos de retorno

### Agregar nueva métrica al dashboard

1. Actualizar modelo de datos (tabla o campos)
2. Modificar query en `TherapyApp.tsx`
3. Crear/actualizar componente en `dashboard/`
4. Agregar visualización (Recharts si es gráfico)

## ⚠️ Consideraciones Importantes

### Seguridad
- **NUNCA** expongas claves de API en el código
- Usa variables de entorno (`VITE_*`)
- RLS está activado en todas las tablas
- Los usuarios solo pueden ver/editar sus propios datos

### Performance
- El streaming de chat usa `ReadableStream` para optimizar tiempo de respuesta
- TanStack Query cachea automáticamente las queries
- Lazy loading de componentes no críticos

### UX/UI
- **Siempre** muestra indicadores de carga (loading states)
- **Animaciones** suaves con Framer Motion
- **Responsive** mobile-first
- **Accesibilidad** con componentes Radix UI

### Datos Sensibles
- Los mensajes de chat contienen información emocional privada
- Cumplir con privacidad: no compartir datos entre usuarios
- Disclaimer: "No reemplaza terapia profesional"

## 🚨 Problemas Comunes y Soluciones

### El chat no se guarda
- ✓ Verificar que `userId` no sea null
- ✓ Comprobar RLS policies en Supabase
- ✓ Revisar logs de la consola

### Análisis no se ejecuta
- ✓ Confirmar que `messageCount === 3`
- ✓ Verificar que Edge Function esté deployed
- ✓ Revisar logs de Supabase Functions

### Streaming no funciona
- ✓ Verificar que response.body?.getReader() exista
- ✓ Comprobar formato de SSE en Edge Function
- ✓ Revisar parsing de "data: [json]"

### Planta no crece
- ✓ Verificar que `confirmedSuggestions` se cuente correctamente
- ✓ Comprobar que las sugerencias tengan `confirmed: true`
- ✓ Revisar que las notas no estén vacías

## 📚 Recursos Útiles

### Documentación
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

### Herramientas de Desarrollo
- React DevTools
- Supabase Studio (local dev)
- Vite DevTools
- ESLint + TypeScript ESLint

## 🎯 Mejores Prácticas

### Al Agregar Funcionalidades
1. ✅ Planificar cambios en la base de datos primero
2. ✅ Crear tipos TypeScript antes de implementar
3. ✅ Implementar lógica backend (Edge Functions) primero
4. ✅ Luego crear componentes UI
5. ✅ Agregar manejo de errores y loading states
6. ✅ Testear flujo completo

### Al Modificar Código Existente
1. ✅ Leer el código circundante para entender contexto
2. ✅ Mantener consistencia con el estilo existente
3. ✅ No romper funcionalidad existente
4. ✅ Actualizar tipos si cambian las interfaces
5. ✅ Probar en dev antes de commit

### Al Debuggear
1. ✅ Revisar console.log() y errores en DevTools
2. ✅ Verificar Network tab para requests fallidos
3. ✅ Revisar Supabase logs para errores de backend
4. ✅ Usar React DevTools para inspeccionar estado
5. ✅ Verificar RLS policies si hay problemas de permisos

## 🤝 Filosofía del Proyecto

Este proyecto está diseñado para:
- 💚 **Apoyar el bienestar emocional** de forma accesible
- 🔒 **Respetar la privacidad** del usuario
- 🌱 **Fomentar el crecimiento personal** con gamificación sutil
- 🎨 **Ofrecer una experiencia hermosa** y calmante
- 🧠 **Usar IA de forma ética** y transparente

**Importante**: Esta app complementa, pero NO reemplaza la terapia profesional.

---

## 📞 Contacto para Agentes

Si encuentras algo que no esté documentado o necesites clarificación:
- Revisa el código en `src/components/TherapyApp.tsx`
- Consulta los tipos en interfaces
- Revisa las migraciones en `supabase/migrations/`
- Lee el README.md para contexto general

---

*Última actualización: 2026-02-02*
