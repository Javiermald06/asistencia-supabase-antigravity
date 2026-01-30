OCUMENTO DE ESPECIFICACIÓN DE REQUERIMIENTOS
Sistema de Control Horario Laboral

Información General del Proyecto 


Proyecto: Sistema de Control Horario Laboral.


Versión: 1.0.


Fecha: Enero 2026.


Tecnologías: Supabase (Base de datos y Autenticación).

1. Introducción

1.1 Propósito del Documento Este documento define los requerimientos funcionales y no funcionales para el desarrollo de un Sistema de Control Horario Laboral. El sistema facilita el registro, seguimiento y análisis de jornadas laborales para gestionar el tiempo de manera eficiente.


1.2 Alcance del Sistema  La aplicación web proporciona las siguientes capacidades:

Registro intuitivo de entradas y salidas laborales.

Gestión de pausas y descansos durante la jornada.

Cálculo automático de horas trabajadas y tiempo de descanso.

Generación de reportes visuales y estadísticas.

Interfaz responsive adaptable a dispositivos móviles y escritorio.

Sistema de autenticación seguro mediante Supabase.

1.3 Audiencia y Referencias El documento está dirigido a desarrolladores, analistas, diseñadores UX/UI y gerentes. Se basa en la documentación oficial de Supabase y estándares W3C y WCAG 2.1.

2. Descripción General del Sistema

2.1 Perspectiva y Funciones Es una aplicación independiente que usa Supabase como plataforma backend para PostgreSQL, autenticación y almacenamiento en tiempo real. Sus funciones incluyen gestión de usuarios, registro de jornadas con timestamp automático, control de pausas, cálculos automáticos, reportes y consulta de historial.


2.2 Características de los Usuarios 

Empleado: Usuario final que registra su jornada. Nivel técnico básico a intermedio. Accede frecuentemente desde móviles.

Supervisor: Responsable de revisar y validar registros de su equipo. Nivel técnico intermedio.

Administrador: Gestiona configuración, usuarios y permisos. Acceso completo al sistema. Nivel técnico avanzado.


2.3 Restricciones y Dependencias 

Obligatoriedad de usar Supabase como backend.

Compatibilidad con Chrome, Firefox, Safari y Edge.

Requiere conexión a internet estable y sincronización de hora en el dispositivo.

La interfaz debe adaptarse desde 320px hasta 4K.

3. Requerimientos Funcionales

3.1 Módulo de Autenticación 


RF-001 Registro de Usuarios: Permite el registro mediante Supabase Auth validando correo y fortaleza de contraseña.


RF-002 Inicio de Sesión: Validación de credenciales, generación de token de sesión y registro del último acceso.


RF-003 Recuperación de Contraseña: Enlace temporal enviado por correo válido por 1 hora.


RF-004 Cierre de Sesión: Invalidación de tokens y limpieza de datos del navegador.


3.2 Módulo de Registro de Jornadas 


RF-006 Marcar Entrada: Captura timestamp del servidor, registra ubicación e inicia contador en tiempo real.


RF-007 Marcar Salida: Registra el fin de jornada, calcula total de horas y resta tiempos de pausa.


RF-008/009 Gestión de Pausas: Permite registrar tipos de pausa (comida, descanso, personal) y calcula su duración total.


RF-010 Visualización Actual: Muestra hora de entrada, tiempo neto trabajado y estado actual (trabajando/en pausa).


3.3 Módulo de Cálculos y Reportes 


RF-011 Cálculo Automático: Cálculo de tiempo total, pausas, tiempo neto y horas extras (si supera 8 horas).


RF-012/013/014 Reportes Diario, Semanal y Mensual: Resúmenes con gráficos, indicadores de cumplimiento y exportación a PDF o Excel.


3.4 Módulo de Historial 


RF-016 Consulta: Búsqueda por rango de fechas, filtros por estado y paginación de 20 registros.


RF-017 Edición: Modificación de registros por supervisores con nota justificativa obligatoria y log de auditoría.

4. Requerimientos No Funcionales

4.1 Rendimiento y Seguridad 

Carga inicial < 3s; marcajes < 1s; reportes < 5s.

Soporte para 1,000 usuarios concurrentes y 10,000 registros sin degradación.

Uso de HTTPS, hash bcrypt para contraseñas y tokens JWT que expiran tras 24h de inactividad.

Implementación de Row Level Security (RLS) y logs de auditoría.


4.2 Usabilidad y Confiabilidad 

Diseño responsive para móviles, tablets y escritorio (320px a 4K).

Cumplimiento de accesibilidad WCAG 2.1 nivel AA y soporte para navegación por teclado.

Disponibilidad del 99.5% y backups automáticos diarios con retención de 30 días.

5. Modelo de Datos

5.1 Tabla: usuarios 

id: UUID, Llave Primaria. Identificador único.

email: VARCHAR(255), Único, No Nulo. Correo electrónico.


nombre_completo: VARCHAR(255), No Nulo.

cargo: VARCHAR(100), Nulo. Posición en la organización.

rol: ENUM, No Nulo. Valores: empleado, supervisor, admin.


zona_horaria: VARCHAR(50), Por defecto UTC.


5.2 Tabla: jornadas 


id: UUID, Llave Primaria.


usuario_id: UUID, Llave Foránea, No Nulo.


fecha: DATE, No Nulo.


hora_entrada: TIMESTAMP, No Nulo.


hora_salida: TIMESTAMP, Nulo.


tiempo_neto_segundos: INTEGER, Nulo.

estado: ENUM, No Nulo. Valores: activa, completada, incompleta.


5.3 Tabla: pausas 


id: UUID, Llave Primaria.


jornada_id: UUID, Llave Foránea, No Nulo.


hora_inicio: TIMESTAMP, No Nulo.


hora_fin: TIMESTAMP, Nulo.


duracion_segundos: INTEGER, Nulo.

estado: ENUM, No Nulo. Valores: activa, finalizada.


5.4 Tabla: auditoria 


id: UUID, Llave Primaria.

usuario_id: UUID, Llave Foránea. Quien realizó la acción.

accion: VARCHAR(100), No Nulo. Descripción del cambio.

valores_anteriores: JSONB, Nulo. Datos antes de la modificación.

6. Criterios de Aceptación
Cumplimiento total de requerimientos RF-001 a RF-018.

Cálculos de horas exactos sin errores de redondeo.

Políticas RLS correctamente configuradas para que cada usuario solo acceda a sus propios datos.

Cobertura de pruebas unitarias superior al 70%.