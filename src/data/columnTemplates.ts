export interface ColumnTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'opinion',
    name: 'Columna de Opinión',
    description: 'Tesis, argumentos y cierre editorial para el domingo.',
    content: `# Título de la Columna

Por {{author}}

## El gancho
Escribe aquí una frase contundente que capture la atención del lector en las primeras líneas.

## Contexto
¿Qué está pasando en el sector minero argentino o global que hace relevante este tema hoy?

## Desarrollo
### Punto 1
Argumento principal con datos o referencia a un proyecto (ej. Los Azules, Josemaría, Veladero).

### Punto 2
Segundo ángulo: impacto económico, regulatorio o social.

### Punto 3
Contrapunto o matiz que demuestre rigor periodístico.

## Conclusión
Cierra con una reflexión clara y una pregunta abierta o llamado a la acción para el lector.

> Cita o dato de impacto para rematar.`
  },
  {
    id: 'technical',
    name: 'Reportaje Técnico',
    description: 'Estructura para explicar procesos, proyectos o conceptos geológicos.',
    content: `# Título Técnico

## Resumen ejecutivo
En 2-3 párrafos: qué, dónde, cuánto y por qué importa.

## Antecedentes del proyecto
- **Ubicación:**
- **Operador / JV:**
- **Commodity principal:**
- **Etapa:** exploración / factibilidad / construcción / producción

## Aspectos geológicos y de reservas
Describe el tipo de yacimiento, ley promedio, tonelaje y método de estimación (NI 43-101 / JORC).

## Proceso y logística
Lixiviación, flotación, infraestructura eléctrica, agua, puerto o concentrado.

## Viabilidad económica
CAPEX, OPEX, precio de referencia del commodity, horizonte de payback.

## Riesgos y perspectivas
Regulatorios, hídricos, comunitarios y de mercado.`
  },
  {
    id: 'brief',
    name: 'Nota Breve',
    description: '300-500 palabras para novedades urgentes del sector.',
    content: `# Titular directo y periodístico

**San Juan / Buenos Aires** — Lead con los 5W: qué pasó, dónde, cuándo, quién y por qué importa.

Párrafo 2: detalle técnico o cifra clave.

Párrafo 3: reacción del mercado, empresa o gobierno.

Párrafo 4 (opcional): contexto histórico en una frase.

_Fuente: comunicado oficial / entrevista / documento regulatorio._`
  },
  {
    id: 'interview',
    name: 'Entrevista / Perfil',
    description: 'Guía para conversaciones con referentes del sector.',
    content: `# Título: "Nombre Apellido: [cita destacada en subtítulo]"

## Presentación del entrevistado
Cargo, empresa, trayectoria y por qué es relevante hoy.

## La conversación

**P — Pregunta de contexto macro**

R —

**P — Pregunta sobre el proyecto o la operación**

R —

**P — Pregunta sobre desafíos (agua, comunidades, regulación)**

R —

**P — Pregunta sobre el futuro del sector en Argentina**

R —

## Para cerrar
Una frase del entrevistado que resuma su visión.`
  }
];
