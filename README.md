# 🌿 Terapia a Tu Lado

**Tu espacio de bienestar emocional profunda**

Terapia a Tu Lado es una aplicación web de acompañamiento terapéutico que utiliza IA para brindar apoyo emocional personalizado, análisis de patrones emocionales y sugerencias diarias para tu crecimiento personal.

## ✨ Características Principales

### 💬 Chat Terapéutico Inteligente
- Conversaciones personalizadas con IA especializada en bienestar emocional
- Respuestas en tiempo real con streaming de mensajes
- Contexto persistente que recuerda tu nombre, edad y conversaciones previas
- Límite de 3 conversaciones diarias para fomentar la reflexión personal

### 📊 Análisis Emocional
- **Detección automática de emociones**: ansiedad, enojo, tristeza, estabilidad y alegría
- **Análisis de patrones**: identifica tus disparadores principales, creencias centrales y evolución emocional
- **Visualización gráfica** de tus estados emocionales a lo largo del tiempo

### 🌱 Seguimiento de Progreso
- **Sistema de planta virtual** que crece con tu progreso personal
- **Racha de días consecutivos** usando la aplicación
- **Contador de sesiones totales** y logros desbloqueados
- Visualización del crecimiento de tu planta (semilla → brote → planta → florecimiento)

### 📝 Sugerencias Diarias Personalizadas
- Sugerencias generadas por IA basadas en tus conversaciones
- Categorías: reflexión, acción práctica, autocuidado
- Sistema de confirmación con notas personales
- Seguimiento de sugerencias completadas

### 🔐 Autenticación y Persistencia
- Autenticación segura con Supabase
- Historial de conversaciones guardado por día
- Perfiles de usuario con información personalizada
- Modo especial para moderadores con opciones de prueba

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para mayor seguridad
- **Vite** - Build tool ultrarrápido
- **React Router DOM** - Navegación entre páginas
- **Framer Motion** - Animaciones fluidas y elegantes

### UI/UX
- **shadcn/ui** - Componentes de UI accesibles y personalizables
- **Radix UI** - Primitivos de UI sin estilo
- **Tailwind CSS** - Framework de CSS utility-first
- **Lucide React** - Iconos modernos y consistentes
- **Recharts** - Gráficos y visualizaciones de datos

### Backend y Datos
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL para base de datos
  - Auth para autenticación
  - Edge Functions para lógica del servidor
- **TanStack Query** - Gestión de estado del servidor y caché

### Validación y Formularios
- **React Hook Form** - Gestión eficiente de formularios
- **Zod** - Validación de esquemas con TypeScript

### Testing
- **Vitest** - Framework de testing ultrarrápido
- **Testing Library** - Utilidades para testing de React
- **jsdom** - Implementación de DOM para testing

## 📁 Estructura del Proyecto

```
terapia-a-tu-lado/
├── src/
│   ├── components/          # Componentes React
│   │   ├── chat/           # Componentes del chat (mensaje, input, typing)
│   │   ├── dashboard/      # Componentes del dashboard (stats, análisis)
│   │   ├── ui/             # Componentes de shadcn/ui
│   │   ├── AuthPage.tsx    # Página de autenticación
│   │   └── TherapyApp.tsx  # Aplicación principal
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Integraciones externas (Supabase)
│   ├── lib/                # Utilidades y helpers
│   ├── pages/              # Páginas de la app
│   │   ├── Index.tsx       # Página principal
│   │   └── NotFound.tsx    # Página 404
│   ├── test/               # Tests unitarios
│   ├── App.tsx             # Componente raíz
│   ├── index.css           # Estilos globales
│   └── main.tsx            # Punto de entrada
├── supabase/
│   ├── functions/          # Edge Functions de Supabase
│   └── migrations/         # Migraciones de base de datos
├── public/                 # Archivos estáticos
├── index.html              # HTML principal con meta tags SEO
├── package.json            # Dependencias y scripts
├── tailwind.config.ts      # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración de Vite
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm (recomendado: [instalación con nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Cuenta de Supabase (para backend)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <YOUR_GIT_URL>
   cd terapia-a-tu-lado
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto con:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   
   La aplicación estará disponible en `http://localhost:5173`

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo con hot-reload

# Build
npm run build            # Construye la aplicación para producción
npm run build:dev        # Construye en modo desarrollo

# Testing
npm run test             # Ejecuta los tests una vez
npm run test:watch       # Ejecuta tests en modo watch

# Linting
npm run lint             # Ejecuta ESLint para verificar código

# Preview
npm run preview          # Previsualiza el build de producción
```

## 🗄️ Base de Datos

El proyecto utiliza Supabase con PostgreSQL. Las tablas principales incluyen:

- **profiles** - Perfiles de usuario (nombre, edad, racha, stats)
- **chat_messages** - Historial de mensajes del chat
- **daily_suggestions** - Sugerencias personalizadas con seguimiento
- **emotion_analyses** - Análisis emocional de las conversaciones

Las migraciones se encuentran en `supabase/migrations/`.

## 🎨 Diseño y UX

### Paleta de Colores
- Gradientes cálidos para elementos positivos
- Tonos sage y naturales para estados de calma
- Sistema de colores personalizado en Tailwind Config

### Características de Diseño
- **Modo responsive**: Optimizado para móvil y escritorio
- **Animaciones suaves**: Transiciones con Framer Motion
- **Sidebar colapsable**: Navegación intuitiva
- **Glassmorphism**: Efectos de vidrio esmerilado modernos
- **Dark mode ready**: Preparado para tema oscuro con next-themes

## 🔒 Seguridad y Privacidad

- Autenticación segura con Supabase Auth
- Datos encriptados en tránsito y en reposo
- Row Level Security (RLS) en base de datos
- Variables de entorno para claves sensibles
- Sin almacenamiento local de datos confidenciales

## 🌐 SEO y Metadata

El proyecto incluye meta tags optimizados para SEO:
- Título descriptivo y meta description
- Open Graph tags para redes sociales
- Twitter Card tags
- Keywords relevantes
- HTML semántico

## 🧪 Testing

El proyecto utiliza Vitest y Testing Library:

```bash
# Ejecutar todos los tests
npm run test

# Modo watch para desarrollo
npm run test:watch
```

## 📦 Despliegue

### Opción 1: Lovable (Recomendado)
1. Abre el proyecto en [Lovable](https://lovable.dev)
2. Click en Share → Publish
3. Configura dominio personalizado en Settings → Domains

### Opción 2: Manual
1. Construye el proyecto: `npm run build`
2. Despliega la carpeta `dist/` en tu servicio de hosting favorito:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Firebase Hosting

## 🤝 Contribución

Este es un proyecto personal de bienestar emocional. Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de uso personal y educativo.

## 🙏 Agradecimientos

- Diseñado con amor para apoyar el bienestar emocional
- Construido con las mejores prácticas de desarrollo web moderno
- Inspirado en la importancia de la salud mental y emocional accesible

---

**Nota importante**: Esta aplicación NO reemplaza la terapia profesional. Si estás experimentando una crisis de salud mental, por favor contacta a un profesional de la salud mental o llama a la línea de emergencia de tu país.

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.

---

Hecho con 💚 para tu bienestar emocional
