const STORE_KEY='fuelTrackerUnifiedPreviewV14';
const defaultState={
  mode:'bike',
  dashMode:'efficiency',
  period:'month',
  selected:{bike:'honda',car:'generic'},
  registrations:{bike:'',car:''},
  currentOdometer:{
    bike:{value:null,updatedAt:null},
    car:{value:null,updatedAt:null}
  },
  records:{bike:[],car:[]}
};
const bikeThemes=[
 {id:'bmw',name:'BMW Motorrad',logo:'BMW',tag:'M PERFORMANCE TFT',a:'#1c69d4',a2:'#0d3e88',lc:'#5aa2ff',spec:['Digital cockpit','BMW blue','Precision UI','Sport touring']},
 {id:'ducati',name:'Ducati',logo:'DUCATI',tag:'ITALIAN RACE',a:'#d71920',a2:'#781015',lc:'#ff494f',spec:['Race cockpit','Red accent','Track focus','Minimal dark']},
 {id:'honda',name:'Honda',logo:'HONDA',tag:'PERFORMANCE FIRST',a:'#d71920',a2:'#851116',lc:'#ff342f',spec:['Sport cockpit','Red accent','Performance UI','Dark theme']},
 {id:'ktm',name:'KTM',logo:'KTM',tag:'READY TO RACE',a:'#f57c00',a2:'#8e4700',lc:'#ff8a15',spec:['Factory cockpit','Orange accent','Aggressive UI','Race focus']},
 {id:'yamaha',name:'Yamaha',logo:'YAMAHA',tag:'MIDNIGHT RACING',a:'#2457d6',a2:'#123d94',lc:'#4a75ff',spec:['Street cockpit','Blue accent','Sport UI','Night theme']},
 {id:'zontes',name:'Zontes',logo:'ZONTES',tag:'TECH NEON',a:'#30c7b5',a2:'#176a63',lc:'#6ee9d9',spec:['Smart cockpit','Cyan accent','Tech UI','Neon theme']}
];
const carThemes=[
 {id:'bmw',name:'BMW',logo:'BMW',tag:'M COCKPIT',a:'#1c69d4',a2:'#0d3e88',lc:'#5ba3ff',spec:['Digital cockpit','M accent','Driver focus','Precision UI']},
 {id:'generic',name:'Generic',logo:'GENERIC',tag:'NEUTRAL OEM',a:'#4f7fa3',a2:'#2a4b61',lc:'#91b7d2',spec:['Neutral design','Universal','Clean cards','Any vehicle']},
 {id:'honda',name:'Honda',logo:'HONDA',tag:'CLEAN COCKPIT',a:'#d71920',a2:'#7f0f14',lc:'#ff434a',spec:['Clean display','Red accent','Balanced UI','Daily drive']},
 {id:'kia',name:'Kia',logo:'KIA',tag:'MODERN MINIMAL',a:'#dfe3e6',a2:'#73787d',lc:'#ffffff',spec:['Wide cockpit','Minimal UI','Modern look','Neutral dark']},
 {id:'mazda',name:'Mazda',logo:'MAZDA',tag:'KODO DARK',a:'#b5121b',a2:'#5d0a0e',lc:'#e33d44',spec:['Kodo-inspired UI','Driver focus','Clean metrics','Dark red']},
 {id:'mercedes',name:'Mercedes',logo:'MERCEDES',tag:'LUXURY • PRECISION • INNOVATION',a:'#139bff',a2:'#0d4e7d',lc:'#79caff',spec:['Digital cockpit','Premium UI','Driver focus','Ambient style']},
 {id:'suzuki',name:'Suzuki',logo:'SUZUKI',tag:'SPORT UTILITY',a:'#1e5cb3',a2:'#0e3d77',lc:'#5a96e7',spec:['Sport UI','Blue accent','Utility','Simple metrics']},
 {id:'toyota',name:'Toyota',logo:'TOYOTA',tag:'CONNECTED DRIVE',a:'#e50019',a2:'#7b0010',lc:'#ff3e50',spec:['Connected UI','Clean metrics','Efficiency','OEM style']}
];