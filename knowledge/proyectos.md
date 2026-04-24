# Proyectos Destacados — Robert Carvajal Franco

## Disney Wallet (Globant, 2024–presente)

**Contexto**: Disney tiene múltiples plataformas (streaming, parques, experiencias físicas, merchandise) y necesitaba un sistema centralizado de wallet para manejar créditos, pagos y activos digitales de forma consistente entre todas ellas.

**Mi rol**: Senior Engineer en el equipo core de wallet services.

**Escala del sistema** (datos públicos Disney 2024):
- 145 millones de visitantes anuales en parques Disney globales
- 122 millones de suscriptores Disney+
- La wallet centraliza pagos, créditos y activos digitales para todas estas plataformas simultáneamente

**Desafíos técnicos**:
- Volumen: millones de transacciones diarias con requerimientos de consistencia fuerte
- Latencia: operaciones de wallet deben ser sub-100ms en el percentil 99
- Consistencia: transacciones distribuidas entre microservicios con garantías ACID donde el negocio lo requiere

**Mi contribución destacada**:
- Integración del método de pago ACH en la wallet de los parques de atracción: implementé los servicios REST que se comunican con el proveedor ACH y habilitan la visualización del método de pago en la billetera del usuario
- Testing integral: pruebas unitarias, de integración y funcionales; apoyo en pruebas de performance para validar SLAs
- Soporte en cambios de frontend con Angular y JavaScript, incluyendo pruebas unitarias

**Decisiones técnicas del equipo**:
- Clean Architecture para aislar el dominio de wallet de los detalles de infraestructura AWS
- DynamoDB para operaciones de lectura intensiva con single-table design
- ECS + Docker para deployment sin estado de los servicios, escala horizontal automática

**Stack**: Java 21, Spring Boot 3, AWS (EC2, ECS, S3, DynamoDB SDK v2, RDS), GitHub Actions, Docker, Angular, JavaScript

**Por qué soy valioso en este proyecto**:
Fui responsable de integrar ACH — un método de pago bancario real — en un sistema que maneja millones de transacciones diarias. Eso requirió entender el negocio de pagos, diseñar contratos REST robustos y garantizar cobertura completa de pruebas en un sistema crítico. Trabajé en inglés con el cliente Disney en todas las instancias del proceso.

**Reto técnico más difícil / Toughest technical challenge**:
Garantizar consistencia entre el servicio ACH externo y la wallet interna en un sistema distribuido de alta concurrencia, asegurando que los estados de pago se reflejen correctamente sin duplicados ni pérdidas, incluso ante fallos parciales.
In English: My toughest challenge was ensuring consistency between the external ACH provider and the internal wallet in a high-concurrency distributed system — guaranteeing payment states were reflected correctly with no duplicates or losses, even under partial failures.

---

## Sistema de Seguros Scotiabank (Image Maker, 2020–2024)

**Contexto**: Scotiabank Colombia necesitaba digitalizar y automatizar el proceso completo de gestión de seguros — desde la cotización hasta la emisión de póliza y el pago de siniestros.

**Mi rol**: Empecé como senior developer y terminé como Technical Leader del proyecto.

**Lo que diseñé desde cero**:
- 5 microservicios con bounded contexts definidos por DDD: `cotizacion`, `emision`, `siniestros`, `pagos`, `notificaciones`
- 5 facades para reestructurar y desacoplar el flujo operacional entre servicios y sistemas legacy del banco
- Sistema event-driven con Kafka: cuando se emite una póliza, los servicios de `pagos` y `notificaciones` reaccionan al evento sin acoplamiento directo
- API Gateway que unifica los microservicios hacia el frontend del banco

**Decisiones de arquitectura que tomé como tech lead**:
- Kafka vs RabbitMQ: elegí Kafka por durabilidad de mensajes y capacidad de replay para auditoría regulatoria
- DDD sobre CRUD: el dominio de seguros es complejo, un CRUD hubiera creado un modelo anémico inutilizable
- Contratos OpenAPI first: definí los contratos antes de implementar, permitió que frontend y backend trabajaran en paralelo

**Resultado**: El sistema procesa el flujo completo de seguros que antes requería intervención manual en múltiples pasos. Reducción de tiempo de emisión de póliza de días a minutos.

**Stack**: Java 17, Spring Boot 3, Spring Cloud, Apache Kafka, DDD, Feign Client, Azure DevOps, SonarQube, Kubernetes

**Por qué soy valioso en este proyecto**:
Pasé de senior developer a technical leader en el mismo proyecto — lo que significa que entregué resultados técnicos y además fui capaz de diseñar la arquitectura completa y guiar al equipo. El sistema reemplazó procesos manuales del banco y redujo el tiempo de emisión de póliza de días a minutos.

**Decisión técnica más difícil**:
Elegir Kafka sobre RabbitMQ fue debatido en el equipo. Mi argumento fue la durabilidad de mensajes y la capacidad de replay, que en un contexto de auditoría regulatoria bancaria no era opcional. También defender DDD sobre un CRUD simple cuando el equipo de negocio tenía prisa — convencí mostrando cómo un modelo anémico generaría deuda técnica insostenible en 6 meses.

---

## Migración Java 11 → 21 con ZGC Generational (proyecto interno)

**Contexto**: Sistema de procesamiento batch que corría en Java 11 con GC pauses de 2–4 segundos afectando SLAs nocturnos.

**Lo que hice**:
- Migración gradual: Java 11 → 17 (sin cambios de código gracias a compatibilidad) → 21
- Configuración del recolector ZGC Generational (`-XX:+UseZGC -XX:+ZGenerational`)
- Profiling con JFR (Java Flight Recorder) para identificar hotspots de memoria

**Resultado**: GC pauses < 1ms en el percentil 99. El batch nocturno que tardaba 4 horas se redujo a 2.5 horas por la eliminación de pause times y mejor uso de hilos virtuales (Virtual Threads Java 21).

**Por qué es relevante para un recruiter / Why this matters to a recruiter**:
Este proyecto demuestra que no solo escribo código nuevo — también puedo diagnosticar y resolver problemas de rendimiento en sistemas existentes.
This shows I can diagnose and fix performance problems in existing systems, not just write new code. I used JFR to profile, identified the GC bottleneck, and executed a gradual migration without breaking compatibility. That's the kind of work that separates a senior from a mid-level engineer.

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
