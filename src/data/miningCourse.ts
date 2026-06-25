export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  content: string;
  keyTerms: string[];
  practicePrompt?: string;
}

export interface CourseStage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  modules: CourseModule[];
}

export const MINING_COURSE: CourseStage[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Fundamentos de la Minería',
    subtitle: 'Qué es la minería, por qué importa y cómo se organiza el sector',
    modules: [
      {
        id: 's1-m1',
        title: 'La minería en la economía global',
        duration: '15 min',
        keyTerms: ['commodity', 'cadena de valor', 'ciclo del commodity'],
        content: `La minería provee las materias primas esenciales para la civilización moderna: desde el cobre en cables eléctricos hasta el litio en baterías.

**¿Por qué importa para Argentina?**
- Generación de divisas y empleo calificado en regiones de baja densidad poblacional.
- Potencial exportador en cobre y litio con demanda estructural creciente.
- Desafío: equilibrar inversión, regalías, empleo y licencia social.

**Ciclo del commodity:** Los precios suben → se invierte en exploración → hay sobreoferta → los precios bajan → se cierran minas → el ciclo reinicia. Entender esto es clave para periodismo económico minero.`
      },
      {
        id: 's1-m2',
        title: 'Tipos de minería y escalas',
        duration: '12 min',
        keyTerms: ['minería a cielo abierto', 'minería subterránea', 'minería de litio'],
        content: `**A cielo abierto (open pit):** Tajo o cantera. Común en pórfidos de cobre y oro de baja ley pero gran volumen (Veladero, futuros Los Azules).

**Subterránea:** Cuando el mineral está profundo o el relieve lo exige. Mayor costo pero menor huella superficial.

**Litio en salares:** Evaporación y procesamiento químico de salmueras. Muy distinto a la minería metálica tradicional.

**Minería artesanal vs industrial:** No confundir operaciones ilegales o de pequeña escala con megaproyectos regulados.`
      },
      {
        id: 's1-m3',
        title: 'Actores del sector en Argentina',
        duration: '18 min',
        keyTerms: ['CAMMESA', 'SEDI', 'provincias mineras', 'RIGI'],
        content: `**Nacional:** Secretaría de Minería, política de exportaciones, RIGI.

**Provincial:** Regalías, permisos ambientales, acuerdos con comunidades (San Juan, Catamarca, Jujuy, Salta lideran).

**Empresas:** Multinacionales (Barrick, BHP, Glencore), medianas (McEwen, Lundin) y juniors de exploración.

**Como columnista:** Identificá siempre quién decide (Nación vs provincia) y quién opera (empresa vs JV).`
      }
    ]
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Geología para Periodistas',
    subtitle: 'Entender yacimientos sin ser geólogo',
    modules: [
      {
        id: 's2-m1',
        title: 'Rocas, minerales y menas',
        duration: '20 min',
        keyTerms: ['mena', 'ganga', 'mineral', 'roca'],
        content: `**Mineral:** Sólido con composición química definida (ej. calcopirita = cobre).

**Mena:** Mineral que se explota económicamente.

**Ganga:** Roca sin valor que acompaña a la mena.

**Tipos de yacimientos argentinos:**
- Pórfidos de Cu-Mo-Au (Los Azules, Josemaría)
- Epitermales de Au-Ag (Veladero)
- Salares de litio (Olaroz, Cauchari)`
      },
      {
        id: 's2-m2',
        title: 'Ley, tonelaje y recursos vs reservas',
        duration: '25 min',
        keyTerms: ['ley', 'recursos', 'reservas', 'NI 43-101'],
        content: `**Ley:** Cantidad de metal por tonelada de roca (% Cu, g/t Au, ppm Li). A mayor ley, generalmente mejor economía.

**Recursos:** Estimación geológica con incertidumbre (inferido, indicado, medido).

**Reservas:** Subconjunto económicamente viable con factibilidad demostrada.

**Regla de oro periodística:** Nunca digas "el yacimiento tiene X toneladas" sin aclarar si son recursos o reservas, y con qué ley de corte.`
      },
      {
        id: 's2-m3',
        title: 'Ley de corte (cut-off grade)',
        duration: '15 min',
        keyTerms: ['ley de corte', 'stripping ratio', 'dilución'],
        content: `La **ley de corte** es el mínimo contenido de metal para que una tonelada sea rentable procesar.

Sube cuando:
- Bajan los precios del commodity
- Aumentan costos energéticos o logísticos

Baja cuando:
- Hay tecnología más eficiente o precios altos

**Ejemplo columnístico:** "Si el cobre cae bajo USD 3,50/lb, varios proyectos argentinos deberían revisar su ley de corte y el tamaño de la mina."`
      }
    ]
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Exploración y Desarrollo',
    subtitle: 'Del descubrimiento a la decisión de construir',
    modules: [
      {
        id: 's3-m1',
        title: 'Etapas del proyecto minero',
        duration: '18 min',
        keyTerms: ['PEA', 'PFS', 'FS', 'FID'],
        content: `1. **Exploración:** Mapeo, geofísica, perforaciones.
2. **PEA / Scoping:** Primera viabilidad preliminar.
3. **PFS (Pre-Factibilidad):** Diseño más detallado.
4. **FS (Factibilidad):** Base para decisión de inversión (FID).
5. **Construcción y ramp-up:** 2-5 años típicos en grandes proyectos.
6. **Operación y cierre:** Vida útil de 15-40+ años.`
      },
      {
        id: 's3-m2',
        title: 'Estudios de impacto ambiental',
        duration: '15 min',
        keyTerms: ['EIA', 'DIA', 'línea base', 'monitoreo'],
        content: `En Argentina los proyectos requieren evaluación ambiental provincial/nacional según escala.

**Para tu columna:** Preguntá siempre qué dice el EIA sobre agua, biodiversidad y emisiones. No te quedes con el comunicado de la empresa: leé el documento público o consultá especialistas.`
      }
    ]
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Procesos Metalúrgicos',
    subtitle: 'Cómo se transforma la roca en metal',
    modules: [
      {
        id: 's4-m1',
        title: 'Flotación y concentrado',
        duration: '20 min',
        keyTerms: ['flotación', 'concentrado', 'recuperación metalúrgica'],
        content: `La **flotación** separa minerales valiosos de la ganga usando burbujas y reactivos. Produce **concentrado de cobre** (~25-30% Cu) que se exporta o funde.

**Recuperación:** % del metal del mineral que efectivamente se obtiene. Una diferencia de 5% puede cambiar millones en ingresos.`
      },
      {
        id: 's4-m2',
        title: 'Lixiviación en cobre y oro',
        duration: '20 min',
        keyTerms: ['lixiviación', 'cátodos', 'heap leach', 'SX-EW'],
        content: `**Lixiviación en pilas (heap leach):** Solución química atraviesa mineral triturado apilado. Clave en Los Azules y muchos yacimientos de oro.

**SX-EW:** Solvente + electroobtención → cátodos de cobre de alta pureza.

**Periodismo:** Cuando una empresa dice "producir cátodos en Argentina", explicá qué implica en empleo, agua y logística.`
      },
      {
        id: 's4-m3',
        title: 'Proceso del litio en salares',
        duration: '18 min',
        keyTerms: ['salmuera', 'carbonato de litio', 'hidróxido de litio', 'evaporación'],
        content: `Bombeo de salmuera → evaporación en pozas → concentración → precipitación química → carbonato o hidróxido de litio.

**Sensibilidad hídrica:** Aunque usan menos agua dulce que una mina de cobre, compiten por recursos en ecosistemas frágiles del altiplano.`
      }
    ]
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Economía Minera',
    subtitle: 'CAPEX, OPEX, regalías y viabilidad',
    modules: [
      {
        id: 's5-m1',
        title: 'CAPEX y OPEX explicados',
        duration: '15 min',
        keyTerms: ['CAPEX', 'OPEX', 'AISC', 'payback'],
        content: `**CAPEX:** Inversión de capital (construcción, planta, infraestructura). Los Azules ~USD 2.500M.

**OPEX:** Costo operativo anual (energía, personal, insumos).

**AISC (costo todo incluido):** Métrica clave en oro/plata.

**Payback:** Años para recuperar la inversión.`
      },
      {
        id: 's5-m2',
        title: 'Regalías y fiscalidad provincial',
        duration: '18 min',
        keyTerms: ['regalías', 'canon', 'royalty', 'convenio minero'],
        content: `Cada provincia define su esquema. San Juan, Catamarca y Jujuy tienen marcos distintos.

**Preguntas para entrevistas:**
- ¿Qué % de las ventas va a regalías?
- ¿Hay estabilidad fiscal por 30 años?
- ¿Cómo se distribuye entre municipios y provincia?`
      }
    ]
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Marco Legal: RIGI y Política',
    subtitle: 'Incentivos, permisos y geopolítica minera argentina',
    modules: [
      {
        id: 's6-m1',
        title: 'RIGI en cinco puntos',
        duration: '20 min',
        keyTerms: ['RIGI', 'estabilidad fiscal', 'drawback', 'gran inversión'],
        content: `El **Régimen de Incentivo para Grandes Inversiones** busca atraer proyectos sobre USD 200M con:
- Estabilidad impositiva por 30 años
- Acceso a mercado de cambios para grandes inversores
- Aceleración de amortizaciones

**Matiz periodístico:** El RIGI no construye minas solo; reduce incertidumbre. El precio del commodity y la licencia social siguen siendo decisivos.`
      },
      {
        id: 's6-m2',
        title: 'Competencia federal y provincial',
        duration: '15 min',
        keyTerms: ['competencia concurrente', 'Código Procesal Minero', 'provincia minera'],
        content: `Las provincias son dueñas del subsuelo. La Nación regula exportaciones y política macro.

Conflictos frecuentes: permisos ambientales, royalty, infraestructura compartida (ej. El Pachón binacional).`
      }
    ]
  },
  {
    id: 'stage-7',
    number: 7,
    title: 'Sustentabilidad y Comunidades',
    subtitle: 'Agua, ambiente y licencia social',
    modules: [
      {
        id: 's7-m1',
        title: 'Huella hídrica y conflictos',
        duration: '20 min',
        keyTerms: ['huella hídrica', 'acuífero', 'agua de deshielo', 'reinyección'],
        content: `La minería es intensiva en agua en zonas áridas (San Juan, Catamarca).

**Distinguir:**
- Agua continental vs agua de deshielo
- Consumo vs recirculación
- Compromisos de reinyección o compensación

Nunca publiques "la mina seca el río" sin verificar el balance hídrico del EIA.`
      },
      {
        id: 's7-m2',
        title: 'Licencia social y consulta',
        duration: '18 min',
        keyTerms: ['licencia social', 'consulta previa', 'conflicto socioambiental'],
        content: `**Licencia social:** Aceptación de comunidades y pueblos originarios.

**Consulta previa:** Derecho a ser consultados en proyectos que afecten sus territorios.

**Buen periodismo:** Escuchar a comunidades, empresas Y técnicos independientes. Evitar el binomio "progreso vs ecología" simplista.`
      }
    ]
  },
  {
    id: 'stage-8',
    number: 8,
    title: 'Periodismo Minero de Alto Nivel',
    subtitle: 'Escribir columnas técnicas, claras e impactantes',
    modules: [
      {
        id: 's8-m1',
        title: 'Estructura de la columna dominical',
        duration: '15 min',
        keyTerms: ['lead', 'nut graf', 'gancho', 'cierre'],
        content: `1. **Lead:** El dato o escena que engancha.
2. **Nut graf:** Por qué importa hoy.
3. **Desarrollo:** 2-3 bloques con datos verificables.
4. **Voces:** Una cita de experto o comunidad.
5. **Cierre:** Mirada al futuro o pregunta al lector.

Usá el Editor de Acero & Roca con plantillas y el Copiloto Gemini para pulir titulares.`
      },
      {
        id: 's8-m2',
        title: 'Verificación y fuentes confiables',
        duration: '20 min',
        keyTerms: ['NI 43-101', 'comunicado de prensa', 'dato primario'],
        content: `**Jerarquía de fuentes:**
1. Reportes técnicos NI 43-101 / presentaciones a inversionistas
2. Documentos regulatorios (EIA, dictámenes)
3. Datos oficiales (INDEC, Secretaría de Minería, LME)
4. Comunicados corporativos (contrastar)
5. Redes sociales (evitar como única fuente)

**Regla:** Si un número parece espectacular, probablemente falta contexto.`
      },
      {
        id: 's8-m3',
        title: 'Proyecto final del curso',
        duration: '30 min',
        keyTerms: ['columna integradora'],
        practicePrompt: 'Redacta una columna de 900 palabras sobre el futuro del cobre en San Juan, citando al menos dos proyectos (Los Azules y Josemaría), el RIGI y un desafío hídrico. Usa el Copiloto para revisar tecnicismos.',
        content: `**Tu desafío final:**

Elegí un proyecto de la sección "Mapa de Proyectos", investigalo con el Agente IA y escribí una columna de opinión usando la plantilla del Editor.

**Checklist:**
- [ ] Título con gancho periodístico
- [ ] Al menos 3 datos verificables
- [ ] Un tecnicismo explicado para el público general
- [ ] Cierre con posición editorial clara

Al completarlo, marcá este módulo y celebrá: ya tenés las bases de un columnista minero especializado.`
      }
    ]
  }
];

export function getTotalModules(): number {
  return MINING_COURSE.reduce((sum, s) => sum + s.modules.length, 0);
}

export function getModuleById(id: string): { stage: CourseStage; module: CourseModule } | null {
  for (const stage of MINING_COURSE) {
    const module = stage.modules.find(m => m.id === id);
    if (module) return { stage, module };
  }
  return null;
}
