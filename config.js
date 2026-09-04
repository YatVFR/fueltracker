const STORE_KEY='fuelTrackerUnifiedPreviewV14';
const defaultState={
  mode:'bike',
  dashMode:'efficiency',
  period:'month',
  selected:{bike:'honda',car:'mercedes'},
  registrations:{bike:'',car:''},
  currentOdometer:{
    bike:{value:63845,updatedAt:'2026-08-31T16:40'},
    car:{value:28640,updatedAt:'2026-08-30T16:25'}
  },
  records:{
    bike:[
      {id:'b1',dateTime:'2026-08-31T16:40',mileage:63845,volume:12.30,cost:62.80,currency:'SGD',fuelGrade:'95 RON',station:'Petron (P03)',notes:'Full tank'},
      {id:'b2',dateTime:'2026-08-24T10:40',mileage:63250,volume:11.80,cost:60.10,currency:'SGD',fuelGrade:'95 RON',station:'Shell',notes:''},
      {id:'b3',dateTime:'2026-08-16T16:00',mileage:62680,volume:11.50,cost:59.40,currency:'SGD',fuelGrade:'95 RON',station:'Caltex',notes:''},
      {id:'b4',dateTime:'2026-08-10T21:00',mileage:62120,volume:11.20,cost:57.80,currency:'SGD',fuelGrade:'95 RON',station:'Petron',notes:''}
    ],
    car:[
      {id:'c1',dateTime:'2026-08-30T16:25',mileage:28640,volume:42.10,cost:121.60,currency:'SGD',fuelGrade:'95 RON',station:'Shell',notes:'Full tank'},
      {id:'c2',dateTime:'2026-08-18T14:06',mileage:28104,volume:39.60,cost:82.40,currency:'MYR',fuelGrade:'95 RON',station:'Petron',notes:''},
      {id:'c3',dateTime:'2026-08-04T08:52',mileage:27575,volume:41.30,cost:118.90,currency:'SGD',fuelGrade:'95 RON',station:'SPC',notes:''}
    ]
  }
};
const bikeThemes=[
 {id:'bmw',name:'BMW Motorrad',logo:'BMW',tag:'M PERFORMANCE TFT',a:'#1c69d4',a2:'#0d3e88',lc:'#5aa2ff',spec:['M cockpit','BMW blue','Precision UI','Sport touring']},
 {id:'ducati',name:'Ducati',logo:'DUCATI',tag:'ITALIAN RACE',a:'#d71920',a2:'#781015',lc:'#ff494f',spec:['Panigale-style','Race TFT','Track focus','Minimal black']},
 {id:'honda',name:'Honda',logo:'HONDA',tag:'PERFORMANCE FIRST',a:'#d71920',a2:'#851116',lc:'#ff342f',spec:['CBR-style cockpit','649 cc • Inline 4','11,500 rpm','192 kg']},
 {id:'ktm',name:'KTM',logo:'KTM',tag:'READY TO RACE',a:'#f57c00',a2:'#8e4700',lc:'#ff8a15',spec:['Factory cockpit','Orange TFT','Aggressive UI','Race focus']},
 {id:'yamaha',name:'Yamaha',logo:'YAMAHA',tag:'MIDNIGHT RACING',a:'#2457d6',a2:'#123d94',lc:'#4a75ff',spec:['MT-style cockpit','Blue TFT','Street sport','Night theme']},
 {id:'zontes',name:'Zontes',logo:'ZONTES',tag:'TECH NEON',a:'#30c7b5',a2:'#176a63',lc:'#6ee9d9',spec:['Smart cockpit','Cyan TFT','Tech ride','Neon theme']}
];
const carThemes=[
 {id:'bmw',name:'BMW',logo:'BMW',tag:'M COCKPIT',a:'#1c69d4',a2:'#0d3e88',lc:'#5ba3ff',spec:['Curved display','M accent','Driver focus','Precision']},
 {id:'generic',name:'Generic',logo:'GENERIC',tag:'NEUTRAL OEM',a:'#4f7fa3',a2:'#2a4b61',lc:'#91b7d2',spec:['Neutral design','Universal','Clean cards','Any vehicle']},
 {id:'honda',name:'Honda',logo:'HONDA',tag:'CLEAN COCKPIT',a:'#d71920',a2:'#7f0f14',lc:'#ff434a',spec:['Clean display','Red accent','Balanced UI','Daily drive']},
 {id:'kia',name:'Kia',logo:'KIA',tag:'MODERN MINIMAL',a:'#dfe3e6',a2:'#73787d',lc:'#ffffff',spec:['Wide cockpit','Minimal UI','Modern look','Neutral dark']},
 {id:'mazda',name:'Mazda',logo:'MAZDA',tag:'KODO DARK',a:'#b5121b',a2:'#5d0a0e',lc:'#e33d44',spec:['Kodo cockpit','Driver focus','Skyactiv','Dark red']},
 {id:'mercedes',name:'Mercedes',logo:'MERCEDES',tag:'LUXURY • PRECISION • INNOVATION',a:'#139bff',a2:'#0d4e7d',lc:'#79caff',spec:['Digital cockpit','Premium UI','197 hp','7.1 L/100 km']},
 {id:'suzuki',name:'Suzuki',logo:'SUZUKI',tag:'SPORT UTILITY',a:'#1e5cb3',a2:'#0e3d77',lc:'#5a96e7',spec:['Sport UI','Blue accent','Utility','Simple metrics']},
 {id:'toyota',name:'Toyota',logo:'TOYOTA',tag:'CONNECTED DRIVE',a:'#e50019',a2:'#7b0010',lc:'#ff3e50',spec:['Connected UI','Clean metrics','Efficiency','OEM style']}
];