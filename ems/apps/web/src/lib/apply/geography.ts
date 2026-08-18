export const APPLY_COUNTRIES = [
  'Rwanda',
  'Burundi',
  'Democratic Republic of Congo',
  'Kenya',
  'Tanzania',
  'Uganda',
  'Ethiopia',
  'Nigeria',
  'South Africa',
  'Other',
] as const

export type ApplyCountry = (typeof APPLY_COUNTRIES)[number]

export interface RegionFieldLabels {
  division: string
  subdivision: string
  divisionPlaceholder: string
  subdivisionPlaceholder: string
}

const DEFAULT_LABELS: RegionFieldLabels = {
  division: 'State / Province / Region',
  subdivision: 'City / Town',
  divisionPlaceholder: 'Select or type your region',
  subdivisionPlaceholder: 'Select or type your city or town',
}

const LABELS_BY_COUNTRY: Partial<Record<ApplyCountry, RegionFieldLabels>> = {
  Rwanda: {
    division: 'District',
    subdivision: 'Sector',
    divisionPlaceholder: 'Select or type your district',
    subdivisionPlaceholder: 'Select or type your sector',
  },
  Kenya: {
    division: 'County',
    subdivision: 'Sub-county / Ward',
    divisionPlaceholder: 'Select or type your county',
    subdivisionPlaceholder: 'Select or type your sub-county or ward',
  },
  Tanzania: {
    division: 'Region',
    subdivision: 'District',
    divisionPlaceholder: 'Select or type your region',
    subdivisionPlaceholder: 'Select or type your district',
  },
  Uganda: {
    division: 'District',
    subdivision: 'Sub-county / Division',
    divisionPlaceholder: 'Select or type your district',
    subdivisionPlaceholder: 'Select or type your sub-county or division',
  },
  Burundi: {
    division: 'Province',
    subdivision: 'Commune',
    divisionPlaceholder: 'Select or type your province',
    subdivisionPlaceholder: 'Select or type your commune',
  },
  'Democratic Republic of Congo': {
    division: 'Province',
    subdivision: 'Territory / Commune',
    divisionPlaceholder: 'Select or type your province',
    subdivisionPlaceholder: 'Select or type your territory or commune',
  },
}

const RWANDA_DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe',
  'Ngoma', 'Nyagatare', 'Rwamagana', 'Burera', 'Gakenke', 'Gicumbi', 'Musanze',
  'Rulindo', 'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza',
  'Nyaruguru', 'Ruhango', 'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke',
  'Rubavu', 'Rusizi', 'Rutsiro',
] as const

const RWANDA_SECTORS_BY_DISTRICT: Record<string, readonly string[]> = {
  Gasabo: [
    'Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru',
    'Kimihurura', 'Kimironko', 'Kinyinya', 'Kisimenti', 'Masaka', 'Ndera', 'Nduba',
    'Remera', 'Rusororo', 'Rutunga',
  ],
  Kicukiro: [
    'Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama',
    'Masaka', 'Niboye', 'Nyarugunga',
  ],
  Nyarugenge: [
    'Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda',
    'Nyamirambo', 'Nyarugenge', 'Rwezamenyo',
  ],
  Bugesera: ['Gashora', 'Juru', 'Kamabuye', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Ntarama', 'Nyamata', 'Nyarugenge', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara'],
  Gatsibo: ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramuruzi', 'Kiziguro', 'Muhura', 'Murambi', 'Ngarama', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'],
  Kayonza: ['Gahini', 'Kabare', 'Kabarondo', 'Mukarange', 'Murama', 'Murundi', 'Mwiri', 'Ndego', 'Nyamirama', 'Rukara', 'Ruramira', 'Rwinkwavu'],
  Kirehe: ['Gahara', 'Gatore', 'Kigarama', 'Kigina', 'Kirehe', 'Mahama', 'Mpanga', 'Musaza', 'Mushikiri', 'Nasho', 'Nyamugari', 'Nyarubuye'],
  Ngoma: ['Gashanda', 'Jarama', 'Karembo', 'Kazo', 'Kibungo', 'Mugesera', 'Murama', 'Mutenderi', 'Remera', 'Rukira', 'Rukumberi', 'Sake', 'Zaza'],
  Nyagatare: ['Gatunda', 'Karangazi', 'Kiyombe', 'Matimba', 'Mimuli', 'Mukama', 'Musheli', 'Nyagatare', 'Rukomo', 'Rwempasha', 'Rwimiyaga', 'Tabagwe'],
  Rwamagana: ['Fumbwe', 'Gahengeri', 'Gishari', 'Karenge', 'Kigabiro', 'Muhazi', 'Munyaga', 'Munyiginya', 'Musha', 'Muyumbu', 'Mwulire', 'Nyakaliro', 'Nzige', 'Rubona'],
  Burera: ['Bungwe', 'Butaro', 'Cyanika', 'Cyeru', 'Gahunga', 'Gatebe', 'Gitovu', 'Kagogo', 'Kinoni', 'Kinyababa', 'Kivuye', 'Nemba', 'Rugarama', 'Rugengabari', 'Ruhunde', 'Rusarabuye', 'Rwerere'],
  Gakenke: ['Busengo', 'Coko', 'Cyabingo', 'Gakenke', 'Gashenyi', 'Janja', 'Kamubuga', 'Karambo', 'Kivuruga', 'Mataba', 'Minazi', 'Mugunga', 'Muyongwe', 'Muzo', 'Nemba', 'Ruli', 'Rusasa', 'Rushashi'],
  Gicumbi: ['Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Giti', 'Kaniga', 'Manyagiro', 'Miyove', 'Kageyo', 'Mukarange', 'Muko', 'Mutete', 'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushaki', 'Rutare', 'Ruvune', 'Rwamikore', 'Shangasha'],
  Musanze: ['Busogo', 'Cyuve', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi', 'Kinigi', 'Muhoza', 'Muko', 'Musanze', 'Nkotsi', 'Nyange', 'Remera', 'Rwaza', 'Shingiro'],
  Rulindo: ['Base', 'Burega', 'Bushoki', 'Buyoga', 'Cyinzuzi', 'Cyungo', 'Kinihira', 'Kisaro', 'Masoro', 'Mbogo', 'Murambi', 'Ngoma', 'Ntarabana', 'Rukozo', 'Rusiga', 'Shyorongi', 'Tumba'],
  Gisagara: ['Gikonko', 'Gishubi', 'Kansi', 'Kibirizi', 'Kigembe', 'Mamba', 'Muganza', 'Musha', 'Ndora', 'Nyanza', 'Save'],
  Huye: ['Gishamvu', 'Huye', 'Karama', 'Kigoma', 'Kinazi', 'Maraba', 'Mbazi', 'Mukura', 'Ruhashya', 'Rusatira', 'Simbi', 'Tumba'],
  Kamonyi: ['Bugesera', 'Busoro', 'Cyanika', 'Gacurabwenge', 'Karama', 'Kayenzi', 'Kayumbu', 'Mugina', 'Musambira', 'Ngamba', 'Nyamiyaga', 'Nyarubaka', 'Rugalika', 'Rukoma', 'Runda'],
  Muhanga: ['Cyeza', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Muhanga', 'Mushishiro', 'Nyabinoni', 'Nyamabuye', 'Nyarusange', 'Rongi', 'Rugendabari', 'Shyogwe'],
  Nyamagabe: ['Buruhukiro', 'Cuanika', 'Gatare', 'Kaduha', 'Kamegeli', 'Kibirizi', 'Kibumbwe', 'Kitabi', 'Mbazi', 'Mugano', 'Musange', 'Musebeya', 'Mushubi', 'Nkomane', 'Tare', 'Uwinkingi'],
  Nyanza: ['Busasamana', 'Busoro', 'Cyabakamyi', 'Kibirizi', 'Kigoma', 'Mukingo', 'Muyira', 'Ntyazo', 'Nyagisozi', 'Rwabicuma'],
  Nyaruguru: ['Busanze', 'Cyahinda', 'Kibeho', 'Kivu', 'Mata', 'Muganza', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi', 'Ruheru', 'Ruramba', 'Rusenge'],
  Ruhango: ['Bweramana', 'Byimana', 'Kabagali', 'Kinazi', 'Kinihira', 'Mbuye', 'Mwendo', 'Ntongwe', 'Ruhango', 'Ruhango (Town)', 'Rusatira'],
  Karongi: ['Bwishyura', 'Gashari', 'Gishyita', 'Gitesi', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu', 'Rubengera', 'Rugabano', 'Ruganda', 'Rwankuba', 'Twumba'],
  Ngororero: ['Bwira', 'Gatumba', 'Hindiro', 'Kabatwa', 'Karago', 'Kavumu', 'Matyazo', 'Muhanda', 'Muhororo', 'Ndaro', 'Ngororero', 'Nyange', 'Sovu'],
  Nyabihu: ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Muringa', 'Rambura', 'Rugera', 'Rurembo', 'Shyira'],
  Nyamasheke: ['Bushekeri', 'Bushenge', 'Cyato', 'Gihombo', 'Kagano', 'Kanjongo', 'Karambi', 'Karengera', 'Kirimbi', 'Macuba', 'Mahembe', 'Nyabitekeri', 'Rangiro', 'Ruharambuga', 'Shangi'],
  Rubavu: ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Kanzenze', 'Mudende', 'Nyakiriba', 'Nyamyumba', 'Nyundo', 'Rubavu', 'Rugerero'],
  Rusizi: ['Bugarama', 'Butare', 'Bweyeye', 'Gashonga', 'Giheke', 'Gihundwe', 'Gitambi', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nyakabuye', 'Nyakarenzo', 'Nzahaha', 'Rwimbogo'],
  Rutsiro: ['Boneza', 'Gihango', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musaza', 'Mushonyi', 'Mushubati', 'Nyabirasi', 'Ruhango', 'Rusebeya'],
}

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira',
  'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

const TANZANIA_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
  'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu',
  'Singida', 'Songwe', 'Tabora', 'Tanga', 'Zanzibar North', 'Zanzibar South', 'Zanzibar West',
]

const UGANDA_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Mbarara', 'Gulu', 'Lira', 'Arua',
  'Kabale', 'Fort Portal', 'Masaka', 'Hoima', 'Soroti', 'Tororo', 'Kasese', 'Rukungiri',
  'Bushenyi', 'Iganga', 'Kamuli', 'Ntungamo', 'Kabarole', 'Kumi', 'Apac', 'Nebbi',
]

const BURUNDI_PROVINCES = [
  'Bujumbura Mairie', 'Bujumbura Rural', 'Bubanza', 'Bururi', 'Cankuzo', 'Cibitoke',
  'Gitega', 'Karuzi', 'Kayanza', 'Kirundo', 'Makamba', 'Muramvya', 'Muyinga', 'Mwaro',
  'Ngozi', 'Rumonge', 'Rutana', 'Ruyigi',
]

const DRC_PROVINCES = [
  'Kinshasa', 'Kongo Central', 'Kwango', 'Kwilu', 'Mai-Ndombe', 'Kasaï', 'Kasaï-Central',
  'Kasaï-Oriental', 'Lomami', 'Sankuru', 'Maniema', 'South Kivu', 'North Kivu', 'Ituri',
  'Haut-Uele', 'Bas-Uele', 'Tshopo', 'Tshuapa', 'Mongala', 'Nord-Ubangi', 'Sud-Ubangi',
  'Équateur', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga',
]

const DIVISIONS_BY_COUNTRY: Partial<Record<ApplyCountry, readonly string[]>> = {
  Rwanda: RWANDA_DISTRICTS,
  Kenya: KENYA_COUNTIES,
  Tanzania: TANZANIA_REGIONS,
  Uganda: UGANDA_DISTRICTS,
  Burundi: BURUNDI_PROVINCES,
  'Democratic Republic of Congo': DRC_PROVINCES,
}

export function getRegionFieldLabels(country: string): RegionFieldLabels {
  return LABELS_BY_COUNTRY[country as ApplyCountry] ?? DEFAULT_LABELS
}

export function getCountryDivisions(country: string): string[] {
  const list = DIVISIONS_BY_COUNTRY[country as ApplyCountry]
  return list ? [...list] : []
}

export function getCountrySubdivisions(country: string, division: string): string[] {
  if (country === 'Rwanda' && division) {
    const sectors = RWANDA_SECTORS_BY_DISTRICT[division]
    return sectors ? [...sectors] : []
  }
  return []
}

export function residenceFieldLabels(country: string): {
  divisionLabel: string
  subdivisionLabel: string
} {
  const labels = getRegionFieldLabels(country)
  return {
    divisionLabel: `${labels.division} of residence`,
    subdivisionLabel: labels.subdivision,
  }
}
