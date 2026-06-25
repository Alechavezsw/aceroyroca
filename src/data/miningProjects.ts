export interface MiningProject {
  id: string;
  name: string;
  province: string;
  commodity: 'Cobre' | 'Oro' | 'Plata' | 'Litio' | 'Oro y Plata';
  operator: string;
  stage: 'Exploración' | 'Factibilidad' | 'Construcción' | 'Producción';
  status: string;
  investment?: string;
  lat: number;
  lng: number;
  highlight: string;
}

export const MINING_PROJECTS: MiningProject[] = [
  {
    id: 'los-azules',
    name: 'Los Azules',
    province: 'San Juan',
    commodity: 'Cobre',
    operator: 'McEwen Copper',
    stage: 'Factibilidad',
    status: 'FS en actualización; enfoque en lixiviación y RIGI',
    investment: '~USD 2.500M',
    lat: -31.2,
    lng: -70.0,
    highlight: 'Pórfido de cobre en Calingasta; uno de los activos de cobre más relevantes de Argentina.'
  },
  {
    id: 'josemaria',
    name: 'Josemaría',
    province: 'San Juan',
    commodity: 'Cobre',
    operator: 'Lundin Mining / BHP (JV)',
    stage: 'Factibilidad',
    status: 'Integración con Filo del Sol en análisis conjunto',
    investment: '~USD 4.000M',
    lat: -31.1,
    lng: -69.8,
    highlight: 'Gran depósito de pórfido de cobre-oro en la Faja de Maricunga.'
  },
  {
    id: 'veladero',
    name: 'Veladero',
    province: 'San Juan',
    commodity: 'Oro y Plata',
    operator: 'Barrick / Shandong Gold',
    stage: 'Producción',
    status: 'Operación activa en Iglesia; extensiones de vida útil',
    lat: -29.4,
    lng: -69.9,
    highlight: 'Mina a cielo abierto de oro y plata; referencia de minería en altura.'
  },
  {
    id: 'el-pachon',
    name: 'El Pachón',
    province: 'San Juan / Mendoza',
    commodity: 'Cobre',
    operator: 'Glencore',
    stage: 'Factibilidad',
    status: 'Proyecto binacional en revisión estratégica',
    investment: '~USD 4.500M',
    lat: -32.8,
    lng: -69.5,
    highlight: 'Megaproyecto de cobre en la cordillera; desafíos binacionales de agua.'
  },
  {
    id: 'filo-del-sol',
    name: 'Filo del Sol',
    province: 'San Juan',
    commodity: 'Cobre',
    operator: 'BHP / Lundin',
    stage: 'Exploración',
    status: 'Descubrimiento de alto sulfuro en frontera con Chile',
    lat: -31.0,
    lng: -69.5,
    highlight: 'Yacimiento de sulfuros de cobre con potencial de escala mundial.'
  },
  {
    id: 'olaroz',
    name: 'Olaroz',
    province: 'Jujuy',
    commodity: 'Litio',
    operator: 'Arcadium Lithium',
    stage: 'Producción',
    status: 'Operación consolidada en el Salar de Olaroz',
    lat: -23.5,
    lng: -66.8,
    highlight: 'Uno de los primeros productores de litio de la región del NOA.'
  },
  {
    id: 'cauchari',
    name: 'Cauchari-Olaroz',
    province: 'Jujuy',
    commodity: 'Litio',
    operator: 'Lithium Americas / Ganfeng',
    stage: 'Construcción',
    status: 'Rampa de producción de carbonato de litio',
    investment: '~USD 1.000M',
    lat: -23.9,
    lng: -66.9,
    highlight: 'Proyecto estratégico chino-argentino en el corazón del Triángulo del Litio.'
  },
  {
    id: 'taca-taca',
    name: 'Taca Taca',
    province: 'Salta',
    commodity: 'Cobre',
    operator: 'First Quantum',
    stage: 'Factibilidad',
    status: 'Esperando condiciones de mercado y marco regulatorio',
    lat: -26.2,
    lng: -67.0,
    highlight: 'Gran pórfido de cobre en Salta con potencial de producción décadas.'
  }
];
