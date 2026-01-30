# Sistema de Control Horario Laboral

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Supabase](https://img.shields.io/badge/database-Supabase-3ECF8E.svg)

> **Proyecto Sprint 0 - Metodología Scrum**  
> Sistema web para gestión y seguimiento de jornadas laborales con autenticación segura y persistencia en tiempo real.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Instalación y Uso](#instalación-y-uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Equipo y Roles](#equipo-y-roles)
- [Aprendizajes del Equipo](#aprendizajes-del-equipo)
- [Licencia](#licencia)

---

## Descripción

**Control Horario Laboral** es una aplicación web fullstack que permite a los empleados registrar sus jornadas laborales de manera intuitiva y eficiente. El sistema captura entradas, salidas y pausas, calculando automáticamente el tiempo neto trabajado y generando reportes detallados.

### Objetivo del Sprint 0
Aplicar la metodología **Scrum** en el desarrollo de un MVP funcional que demuestre:
- Trabajo colaborativo en equipo
- Uso de herramientas profesionales (Google Antigravity, Supabase MCP)
- Persistencia real en base de datos
- Arquitectura escalable y mantenible

---

## Stack Tecnológico

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS y gradientes
- **JavaScript (Vanilla)** - Lógica de cliente sin frameworks

### Backend y Base de Datos
- **Supabase** - Backend as a Service
  - PostgreSQL para persistencia
  - Supabase Auth para autenticación
  - Row Level Security (RLS) para seguridad
- **Supabase MCP** - Model Context Protocol para gestión de BD

### Herramientas de Desarrollo
- **Google Antigravity** - IDE con capacidades de agentes IA
- **Git & GitHub** - Control de versiones
- **Trello** - Gestión de Sprint Backlog

---

## Funcionalidades

###  Autenticación
- [x] Registro de nuevos usuarios
- [x] Inicio de sesión seguro
- [x] Cierre de sesión con limpieza de tokens
- [x] Validación de credenciales

###  Registro de Jornadas
- [x] **Iniciar Jornada** - Captura automática de timestamp
- [x] **Pausas Clasificadas**:
  -  Comida
  -  Descanso
  -  Personal
- [x] **Finalizar Jornada** - Cálculo automático de tiempos
- [x] **Timer en Tiempo Real** - Visualización del tiempo transcurrido

###  Dashboard
- [x] Resumen de horas trabajadas hoy
- [x] Tiempo total en pausas
- [x] Horas semanales acumuladas
- [x] Estado actual de la jornada
- [x] Actividad detallada del día

###  Reportes
- [x] **Reporte Diario** - Detalle de una jornada específica
- [x] **Reporte Semanal** - Resumen de la semana en curso
- [x] **Reporte Mensual** - Estadísticas mensuales

###  Historial
- [x] Consulta de jornadas anteriores
- [x] Filtros por rango de fechas
- [x] Visualización detallada de pausas

---

## Arquitectura

### Modelo de Datos

```
┌─────────────┐
│  usuarios   │
├─────────────┤
│ id (PK)     │
│ email       │
│ nombre      │
│ rol         │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│  jornadas   │
├─────────────┤
│ id (PK)     │
│ usuario_id  │◄─────┐
│ fecha       │      │
│ hora_entrada│      │ 1:N
│ hora_salida │      │
│ estado      │      │
└─────────────┘      │
       │             │
       │ 1:N         │
       ▼             │
┌─────────────┐      │
│   pausas    │      │
├─────────────┤      │
│ id (PK)     │      │
│ jornada_id  │──────┘
│ tipo        │
│ hora_inicio │
│ hora_fin    │
└─────────────┘
```

### Flujo de Autenticación

```
Usuario → Login → Supabase Auth → JWT Token → Session Storage
                      ↓
                  Validación
                      ↓
              Dashboard/Redirect
```

### Cálculo de Tiempos

```
Tiempo Total = hora_salida - hora_entrada
Tiempo en Pausas = Σ(duracion_pausas)
Tiempo Neto = Tiempo Total - Tiempo en Pausas
```

---

## Instalación y Uso

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Cuenta en Supabase (para desarrollo)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/AppControlHorario.git
cd AppControlHorario
```

2. **Instalar dependencias (opcional)**
```bash
npm install
```

3. **Configurar Supabase**
   - Crear proyecto en [Supabase](https://supabase.com)
   - Copiar URL y Anon Key
   - Actualizar `js/config.js`:
   ```javascript
   const SUPABASE_URL = 'tu-url-de-proyecto';
   const SUPABASE_ANON_KEY = 'tu-anon-key';
   ```

4. **Abrir la aplicación**
   - Opción 1: Abrir `index.html` en el navegador
   - Opción 2: Usar Live Server (recomendado)
   ```bash
   npx live-server
   ```

### Uso

1. **Registro**: Crear una cuenta nueva
2. **Login**: Iniciar sesión con credenciales
3. **Iniciar Jornada**: Click en "Iniciar Jornada"
4. **Gestionar Pausas**: Iniciar/finalizar pausas según necesidad
5. **Finalizar Jornada**: Click en "Finalizar Jornada"
6. **Ver Reportes**: Navegar a Reportes o Historial

---

## Estructura del Proyecto

```
AppControlHorario/
├── index.html              # Punto de entrada
├── package.json            # Dependencias
├── README.md              # Este archivo
├── Requeriments.md        # Especificación completa
│
├── js/                    # Lógica de la aplicación
│   ├── config.js         # Configuración y constantes
│   ├── auth.js           # Autenticación
│   ├── timetracking.js   # Gestión de jornadas/pausas
│   ├── dashboard.js      # Lógica del dashboard
│   ├── reports.js        # Generación de reportes
│   ├── history.js        # Historial de jornadas
│   ├── router.js         # Sistema de rutas SPA
│   └── utils.js          # Funciones auxiliares
│
├── styles/               # Estilos CSS
│   ├── main.css         # Variables y reset
│   └── components.css   # Componentes reutilizables
│
└── views/               # Vistas HTML
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── reports.html
    └── history.html
```

---

## Equipo y Roles

### Roles Scrum

| Rol | Responsable | Responsabilidades |
|-----|-------------|-------------------|
| **Scrum Master** | [Nombre] | Facilitación de eventos, eliminación de impedimentos |
| **Product Owner** | [Nombre] | Definición de Sprint Goal, priorización del Backlog |
| **Developer 1** | [Nombre] | Frontend, diseño UI/UX |
| **Developer 2** | [Nombre] | Backend, integración Supabase |
| **Developer 3** | [Nombre] | Testing, debugging, documentación |

### Sprint Goal
> *"Desarrollar un MVP funcional de Control Horario con autenticación completa, registro de jornadas y persistencia en Supabase."*

---

## Aprendizajes del Equipo

### Metodología Scrum
- ✅ **Sprint Planning**: Aprendimos a estimar historias de usuario y definir un Sprint Goal alcanzable
- ✅ **Daily Scrum**: La sincronización diaria mejoró la comunicación y detectó bloqueos temprano
- ✅ **Sprint Review**: Presentar el incremento funcional al PO validó que íbamos en la dirección correcta
- ✅ **Sprint Retrospective**: Identificamos mejoras para futuros sprints (mejor documentación de código, más testing)

### Técnicas de Desarrollo
-  **Google Antigravity con Agentes**: Aprendimos a usar Planning Mode para diseñar arquitectura antes de codificar
-  **Supabase MCP**: Descubrimos cómo gestionar bases de datos mediante protocolo MCP con el asistente
-  **Row Level Security**: Implementamos políticas RLS para asegurar que cada usuario solo acceda a sus datos
-  **SPA con Vanilla JS**: Construimos un router simple sin frameworks, entendiendo los fundamentos

### Debugging y Resolución de Problemas
-  **Event Listeners Duplicados**: Aprendimos a prevenir memory leaks clonando elementos del DOM
-  **Cálculos de Tiempo**: Debuggeamos problemas de timezone y redondeo usando timestamps UTC
-  **Consultas Supabase**: Optimizamos queries para evitar errores de "multiple rows" con `.limit(1)`

### Trabajo Colaborativo
-  **Pull Requests**: Cada feature tuvo su rama y revisión de código
-  **Integración Continua**: Aprendimos a mergear cambios frecuentemente para evitar conflictos
-  **Comunicación Asíncrona**: Documentar decisiones en commits y PRs ayudó a mantener contexto

### Arquitectura y Buenas Prácticas
-  **Separación de Responsabilidades**: Dividir código en módulos (auth, timetracking, utils) mejoró mantenibilidad
-  **Design System**: Usar variables CSS facilitó mantener consistencia visual
-  **Accesibilidad**: Implementar navegación por teclado y labels semánticos desde el inicio

---

## Seguridad

- ✅ **Autenticación JWT** con Supabase Auth
- ✅ **Row Level Security (RLS)** en PostgreSQL
- ✅ **HTTPS** obligatorio en producción
- ✅ **Validación de inputs** en cliente y servidor
- ✅ **Sesiones con expiración** automática

---

## Próximas Mejoras (Backlog)

- [ ] Recuperación de contraseña
- [ ] Edición de registros históricos (rol supervisor)
- [ ] Exportación de reportes a PDF/Excel
- [ ] Notificaciones push cuando se alcancen 8 horas
- [ ] Gráficos visuales en reportes
- [ ] Soporte multiidioma (i18n)
- [ ] Modo offline con sincronización

---

## Licencia

Este proyecto fue desarrollado como parte del Sprint 0 - Proyecto Académico Scrum.

---

## Agradecimientos

- **Google Antigravity** - Por facilitar el desarrollo con capacidades de agentes IA
- **Supabase** - Por proporcionar una plataforma backend robusta y fácil de usar
- **Equipo Scrum** - Por el compromiso y colaboración durante el sprint

---

**Desarrollado usando Scrum y Google Antigravity**
