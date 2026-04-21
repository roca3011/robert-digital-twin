# Proyectos Destacados — Robert Carvajal Franco

## Disney Wallet (Globant, 2024–presente)

**Contexto**: Disney tiene múltiples plataformas (streaming, parques, experiencias físicas, merchandise) y necesitaba un sistema centralizado de wallet para manejar créditos, pagos y activos digitales de forma consistente entre todas ellas.

**Mi rol**: Senior Engineer en el equipo core de wallet services.

**Desafíos técnicos**:
- Volumen: millones de transacciones diarias con requerimientos de consistencia fuerte
- Latencia: operaciones de wallet deben ser sub-100ms en el percentil 99
- Consistencia: transacciones distribuidas entre microservicios con garantías ACID donde el negocio lo requiere

**Decisiones técnicas destacadas**:
- Clean Architecture para aislar el dominio de wallet de los detalles de infraestructura AWS
- DynamoDB para operaciones de lectura intensiva con single-table design
- ECS + Docker para deployment sin estado de los servicios, escala horizontal automática

**Stack**: Java 21, Spring Boot 3, AWS (EC2, ECS, S3, DynamoDB SDK v2, RDS), GitHub Actions, Docker

---

## Sistema de Seguros Scotiabank (Image Maker, 2020–2024)

**Contexto**: Scotiabank Colombia necesitaba digitalizar y automatizar el proceso completo de gestión de seguros — desde la cotización hasta la emisión de póliza y el pago de siniestros.

**Mi rol**: Empecé como senior developer y terminé como Technical Leader del proyecto.

**Lo que diseñé desde cero**:
- Arquitectura de microservicios basada en DDD con bounded contexts claramente definidos: `cotizacion`, `emision`, `siniestros`, `pagos`
- Sistema event-driven con Kafka: cuando se emite una póliza, los servicios de `pagos` y `notificaciones` reaccionan al evento sin acoplamiento directo
- API Gateway que unifica los microservicios hacia el frontend del banco

**Decisiones de arquitectura que tomé como tech lead**:
- Kafka vs RabbitMQ: elegí Kafka por durabilidad de mensajes y capacidad de replay para auditoría regulatoria
- DDD sobre CRUD: el dominio de seguros es complejo, un CRUD hubiera creado un modelo anémico inutilizable
- Contratos OpenAPI first: definí los contratos antes de implementar, permitió que frontend y backend trabajaran en paralelo

**Resultado**: El sistema procesa el flujo completo de seguros que antes requería intervención manual en múltiples pasos. Reducción de tiempo de emisión de póliza de días a minutos.

**Stack**: Java 17, Spring Boot 3, Spring Cloud, Apache Kafka, DDD, Feign Client, Azure DevOps, SonarQube, Kubernetes

---

## Migración Java 11 → 21 con ZGC Generational (proyecto interno)

**Contexto**: Sistema de procesamiento batch que corría en Java 11 con GC pauses de 2–4 segundos afectando SLAs nocturnos.

**Lo que hice**:
- Migración gradual: Java 11 → 17 (sin cambios de código gracias a compatibilidad) → 21
- Configuración del recolector ZGC Generational (`-XX:+UseZGC -XX:+ZGenerational`)
- Profiling con JFR (Java Flight Recorder) para identificar hotspots de memoria

**Resultado**: GC pauses < 1ms en el percentil 99. El batch nocturno que tardaba 4 horas se redujo a 2.5 horas por la eliminación de pause times y mejor uso de hilos virtuales (Virtual Threads Java 21).

---

## AquaAccess / InkoSwim — SaaS propio para complejos acuáticos (Colombia)

**Contexto**: Detecté un problema real: los complejos acuáticos en Colombia (piscinas públicas, clubes) no tienen sistema de gestión digital. Control de acceso en papel, cobro manual, sin métricas.

**Lo que construí**:
Sistema SaaS con 3 tiers:
1. **Backend API**: Spring Boot + PostgreSQL para gestión de miembros, accesos, pagos
2. **Dashboard admin**: para gerentes del complejo (reportes, control de membresías)
3. **App de acceso**: integración con torniquetes físicos para control de entrada

**Particularidades del mercado colombiano que diseñé**:
- Integración con WhatsApp Business API para notificaciones (Colombia es WhatsApp-first)
- Crédito/fiado como método de pago (común en Colombia) con gestión de deuda
- Cumplimiento Ley Emiliani (Colombia exige acceso a piscinas para personas con discapacidad)

**Estado actual**: Validado con 2 complejos acuáticos en Colombia como beta. Modelo de negocio SaaS por mensualidad por complejo.

---

## App Fitness Personal — Migración Base44 → Supabase (2024–presente)

**Contexto**: Tenía una app de fitness construida sobre Base44 (no-code). Al crecer las necesidades, el no-code se volvió limitante: sin control sobre la base de datos, sin posibilidad de lógica personalizada.

**Lo que hice**:
- Migración usando Strangler Fig Pattern: no reescribí todo de golpe, sino fui reemplazando módulos uno a uno
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Frontend: Next.js + TypeScript + Tailwind
- La app Base44 original siguió funcionando durante la migración para los usuarios activos

**Por qué Strangler Fig**:
- Usuarios reales activos — no podía permitirme downtime
- Aprendí Next.js y Supabase en el proceso, aplicando cada uno en producción real
- Cada módulo migrado fue un experimento controlado

**Estado actual**: Beta con usuarios activos. Funcionalidades: tracking de entrenamientos, progresión de peso, estadísticas semanales.

**Lo interesante técnicamente**: Este proyecto es donde aprendí RAG + embeddings — el mismo stack que estoy usando en este portfolio digital que estás viendo ahora mismo.
