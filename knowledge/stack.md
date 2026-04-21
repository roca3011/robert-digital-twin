# Stack Tecnológico — Robert Carvajal Franco

## Backend Core (nivel avanzado, uso diario)

**Java**: Mi lenguaje principal. He trabajado con Java 8, 11, 17 y 21 en producción. Conozco bien las diferencias entre versiones — records, sealed classes, pattern matching, ZGC. Actualmente trabajo con Java 21.

**Spring Boot 3**: Construcción de APIs REST, configuración de seguridad, manejo de excepciones, validación, actuators. No uso Spring como "magia" — entiendo el contexto de aplicación, el ciclo de vida de los beans y cómo depurar problemas de configuración.

**Spring Data JPA**: Modelado de entidades, relaciones, queries JPQL y nativas, proyecciones, paginación. Sé cuándo NO usar JPA (operaciones masivas → JDBC o Batch).

**Spring Batch**: Procesamiento masivo de datos. Readers/Writers/Processors, particionamiento, restart/retry. Usado en SURA para procesar cientos de miles de registros nocturnos.

**Spring Cloud**: Circuit breakers (Resilience4j), config server, Feign Client para comunicación entre microservicios. Usado extensivamente en Scotiabank.

**Feign Client**: Integración entre microservicios y con APIs externas con contratos OpenAPI. Manejo de fallbacks y timeouts.

## Mensajería

**Apache Kafka**: Incorporado en 2024 para arquitectura event-driven en Scotiabank/Image Maker. Conozco producers, consumers, consumer groups, tópicos, particiones, y patterns como Saga y outbox pattern.

## Cloud

**AWS** (uso activo en Globant/Disney):
- EC2: provisioning, autoscaling groups
- ECS: deployment de containers Docker
- S3: almacenamiento y recuperación de objetos, presigned URLs
- DynamoDB SDK v2: operaciones CRUD, GSI, design de tabla single-table
- RDS: PostgreSQL administrado

**Azure**: Certificación AZ-900. Uso de Azure DevOps (pipelines, boards, repos). No tengo experiencia profunda en servicios de compute Azure, pero entiendo la plataforma.

## DevOps y CI/CD

**Docker**: Construcción de imágenes, multi-stage builds, docker-compose para desarrollo local. Sé optimizar imágenes para minimizar tamaño.

**Kubernetes**: Deployments, Services, ConfigMaps, Secrets, Helm charts básicos. Experiencia en Santander/Samtel. No soy DevOps, pero sé suficiente para no romper el cluster.

**GitHub Actions**: Pipelines completos: build → test → SonarQube → deploy. Configuración de secrets, environments, matrix builds.

**Azure DevOps**: Pipelines YAML, gestión de boards, repos. Usado como herramienta principal en Image Maker.

**SonarQube**: Configuración de quality gates, análisis de cobertura, detección de code smells y security hotspots.

## Testing

**JUnit 5**: Anotaciones, parametrized tests, test lifecycle. Testing unitario serio — no mocks para todo, sino tests que validan comportamiento real.

**MockMvc**: Testing de controllers Spring MVC sin levantar servidor. Integration tests de capas HTTP.

**Spock (Groovy)**: Usado en algunos proyectos para specs más legibles. Conozco la sintaxis given/when/then.

**Karate**: Framework BDD para API testing. Tests de contrato y end-to-end.

**JMeter**: Performance testing. Planes de prueba para validar SLAs antes de deploy a producción.

## Arquitectura y Diseño

**Clean Architecture**: Separación en capas: domain, application, infrastructure, presentation. El dominio no depende de frameworks — puedo cambiar Spring por Quarkus sin tocar la lógica de negocio.

**Domain-Driven Design (DDD)**: Aggregates, entities, value objects, repositories, domain events, bounded contexts. Aplicado en diseño del sistema de seguros Scotiabank.

**Event-Driven Architecture**: Comunicación asíncrona via Kafka. Patrones Saga (coreografía y orquestación), outbox pattern para consistency.

**Microservicios**: Diseño de servicios con responsabilidad única, comunicación sync (REST/Feign) y async (Kafka), gestión de fallos con circuit breakers.

**REST API Design**: Recursos, verbos HTTP correctos, versioning, paginación, manejo consistente de errores (RFC 7807).

## Bases de datos

**DynamoDB**: Diseño de tabla única (single-table design), GSI, operaciones transaccionales.

**PostgreSQL**: Queries complejas, índices, explain analyze, conexión desde Spring.

**MySQL**: Uso en proyectos anteriores.

**Oracle 11g / PL/SQL**: Experiencia profunda en Open Systems — stored procedures, functions, triggers, optimización.

## Herramientas de desarrollo

**IntelliJ IDEA**: IDE principal. Uso plugins para Kubernetes, Docker, Sonar, HTTP Client. Tengo shortcuts memorizados para todo.

**Git**: Workflows con GitFlow y trunk-based development. Rebase, cherry-pick, resolución de conflictos complejos.

**Maven**: Gestión de dependencias, multi-module projects, plugins personalizados.

## Explorando (proyectos personales)

**Next.js + TypeScript**: Construyendo apps propias (portfolio, fitness tracker).
**Supabase**: Backend-as-a-service para proyectos side.
**pgvector + RAG**: Implementando en este mismo portfolio que estás viendo.
