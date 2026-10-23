/** Colombian cities and main towns by department. The saved value is "Ciudad, Departamento", so two towns with one name stay apart. */
const BY_DEPARTMENT: Record<string, string[]> = {
  Amazonas: ["Leticia"],
  Antioquia: [
    "Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Turbo", "Rionegro", "Sabaneta", "Caldas", "La Estrella",
    "Copacabana", "Girardota", "Marinilla", "Carepa", "Caucasia", "Chigorodó", "Santa Rosa de Osos",
  ],
  Arauca: ["Arauca", "Arauquita", "Saravena", "Tame"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Baranoa", "Puerto Colombia", "Galapa"],
  Bolívar: ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar", "Mompós"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"],
  Caldas: ["Manizales", "La Dorada", "Villamaría", "Chinchiná", "Riosucio"],
  Caquetá: ["Florencia"],
  Casanare: ["Yopal", "Aguazul", "Villanueva"],
  Cauca: ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
  Cesar: ["Valledupar", "Aguachica", "Bosconia", "Agustín Codazzi"],
  Chocó: ["Quibdó", "Istmina"],
  Córdoba: ["Montería", "Cereté", "Lorica", "Sahagún", "Montelíbano", "Planeta Rica"],
  Cundinamarca: [
    "Soacha", "Fusagasugá", "Chía", "Zipaquirá", "Facatativá", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá",
    "Sibaté", "Cota", "La Calera",
  ],
  "Bogotá D.C.": ["Bogotá"],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare"],
  Huila: ["Neiva", "Pitalito", "Garzón", "La Plata"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca"],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación", "Zona Bananera", "El Banco"],
  Meta: ["Villavicencio", "Acacías", "Granada", "Puerto López"],
  Nariño: ["Pasto", "Tumaco", "Ipiales"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Villa del Rosario", "Pamplona", "Los Patios", "Tibú"],
  Putumayo: ["Mocoa", "Puerto Asís", "Orito"],
  Quindío: ["Armenia", "Calarcá", "Montenegro", "La Tebaida"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andrés y Providencia": ["San Andrés"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil", "Socorro"],
  Sucre: ["Sincelejo", "Corozal", "Sampués"],
  Tolima: ["Ibagué", "Espinal", "Melgar", "Honda", "Chaparral", "Líbano"],
  "Valle del Cauca": [
    "Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo", "Candelaria", "Florida", "Sevilla",
  ],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño"],
};

/** Every option, sorted the way a Spanish reader expects (accents do not move a name). */
export const CITIES: string[] = Object.entries(BY_DEPARTMENT)
  .flatMap(([department, cities]) => cities.map((city) => `${city}, ${department}`))
  .sort((a, b) => a.localeCompare(b, "es"));

const CITY_SET = new Set(CITIES);

export function isColombianCity(value: unknown): value is string {
  return typeof value === "string" && CITY_SET.has(value);
}
