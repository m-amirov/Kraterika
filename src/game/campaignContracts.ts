import type {ContractConfig,AttemptCommand,Point} from './campaign.ts';

const p=(x:number,y:number):Point=>({x,y});
const place=(tool:'route'|'charger'|'arm'|'greenhouse',at:Point):AttemptCommand=>({type:'place',tool,at});
const steps=(count:number):AttemptCommand[]=>Array.from({length:count},()=>({type:'step'} as const));

export const CONTRACTS:ContractConfig[]=[
  {
    id:'CT-01',name:'Первый сигнал',goal:'Восстановите линию и доставьте сигнальный модуль в диспетчерскую.',
    prerequisite:null,requiredMechanics:['route'],availableTools:['route'],attemptBudget:3,
    permanentCost:4,rewardMaterials:8,worldEffect:'dispatch',production:null,
    buildSites:{route:[p(3,4)]},toolCosts:{route:1},
    robots:[{id:'R-01',energy:5,cargoId:'signal',path:[p(1,4),p(2,4),p(3,4),p(4,4)]}],
    cargo:[{id:'signal',kind:'signal',destination:'dispatch'}],
    medals:{gold:{maxTicks:3,maxSpent:1,maxEnergy:3},silver:{maxTicks:5,maxSpent:2,maxEnergy:4}},
    solution:[place('route',p(3,4)),...steps(3)]
  },
  {
    id:'CT-02',name:'Два рейса',goal:'Разведите два рейса общей стрелкой к разным получателям.',
    prerequisite:'CT-01',requiredMechanics:['route','switch','twoRobots'],availableTools:['route','switch'],attemptBudget:4,
    permanentCost:0,rewardMaterials:7,worldEffect:'distribution',production:null,
    buildSites:{route:[p(3,1)],switch:[p(2,1)]},toolCosts:{route:1},
    robots:[
      {id:'R-01',energy:4,cargoId:'water',path:[p(1,1),p(2,1),p(3,1)]},
      {id:'R-02',energy:4,cargoId:'parts',path:[p(2,0),p(2,1),p(2,2)]}
    ],
    cargo:[{id:'water',kind:'water',destination:'habitat'},{id:'parts',kind:'parts',destination:'distribution'}],
    medals:{gold:{maxTicks:3,maxSpent:1,maxEnergy:4},silver:{maxTicks:5,maxSpent:2,maxEnergy:6}},
    solution:[place('route',p(3,1)),{type:'priority',robotId:'R-01'},...steps(3)]
  },
  {
    id:'CT-03',name:'Последний заряд',goal:'Проведите дальний рейс через рабочую зарядную площадку.',
    prerequisite:'CT-02',requiredMechanics:['route','charger'],availableTools:['route','charger'],attemptBudget:6,
    permanentCost:6,rewardMaterials:9,worldEffect:'power',production:null,
    buildSites:{route:[p(5,3)],charger:[p(3,3)]},toolCosts:{route:1,charger:3},
    robots:[{id:'R-01',energy:2,cargoId:'cell',path:[p(1,3),p(2,3),p(3,3),p(4,3),p(5,3),p(6,3)]}],
    cargo:[{id:'cell',kind:'powerCell',destination:'power'}],
    medals:{gold:{maxTicks:6,maxSpent:4,maxEnergy:5},silver:{maxTicks:8,maxSpent:5,maxEnergy:6}},
    solution:[place('route',p(5,3)),place('charger',p(3,3)),...steps(6)]
  },
  {
    id:'CT-04',name:'Рука мастера',goal:'Передайте детали манипулятором через разрыв терминала.',
    prerequisite:'CT-03',requiredMechanics:['route','arm'],availableTools:['route','arm'],attemptBudget:7,
    permanentCost:12,rewardMaterials:10,worldEffect:'workshop',production:{components:2},
    buildSites:{route:[p(5,5)],arm:[p(6,5)]},toolCosts:{route:1,arm:4},
    robots:[{id:'R-01',energy:5,cargoId:'parts',path:[p(2,5),p(3,5),p(4,5),p(5,5),p(6,5)]}],
    cargo:[{id:'parts',kind:'parts',destination:'workshop'}],
    medals:{gold:{maxTicks:4,maxSpent:5,maxEnergy:4},silver:{maxTicks:6,maxSpent:6,maxEnergy:5}},
    solution:[place('route',p(5,5)),place('arm',p(6,5)),...steps(4),{type:'transfer'}]
  },
  {
    id:'CT-05',name:'Семена под куполом',goal:'Соберите купол и снабдите оранжерею водой.',
    prerequisite:'CT-04',requiredMechanics:['route','greenhouse'],availableTools:['route','greenhouse'],attemptBudget:9,
    permanentCost:14,rewardMaterials:12,worldEffect:'greenhouse',production:{food:2},
    buildSites:{route:[p(8,2)],greenhouse:[p(9,2)]},toolCosts:{route:1,greenhouse:6},
    robots:[{id:'R-01',energy:5,cargoId:'water',path:[p(6,2),p(7,2),p(8,2),p(9,2)]}],
    cargo:[{id:'water',kind:'water',destination:'greenhouse'}],
    medals:{gold:{maxTicks:3,maxSpent:7,maxEnergy:3},silver:{maxTicks:5,maxSpent:8,maxEnergy:4}},
    solution:[place('route',p(8,2)),place('greenhouse',p(9,2)),...steps(3)]
  },
  {
    id:'CT-06',name:'Рассвет на станции',goal:'Снабдите мастерскую и оранжерею через общий узел без затора.',
    prerequisite:'CT-05',requiredMechanics:['route','switch','twoRobots','functionalBuildings'],availableTools:['route','switch'],attemptBudget:5,
    permanentCost:8,rewardMaterials:14,worldEffect:'district1',production:null,
    buildSites:{route:[p(6,4)],switch:[p(5,4)]},toolCosts:{route:1},requiresBuildings:['workshop','greenhouse'],
    robots:[
      {id:'R-01',energy:6,cargoId:'water',path:[p(4,4),p(5,4),p(6,4),p(7,4),p(8,3),p(9,2)]},
      {id:'R-02',energy:6,cargoId:'ore',path:[p(5,3),p(5,4),p(5,5),p(6,5),p(7,5),p(8,5)]}
    ],
    cargo:[{id:'water',kind:'water',destination:'greenhouse'},{id:'ore',kind:'ore',destination:'workshop'}],
    medals:{gold:{maxTicks:6,maxSpent:1,maxEnergy:10},silver:{maxTicks:8,maxSpent:2,maxEnergy:12}},
    solution:[place('route',p(6,4)),{type:'priority',robotId:'R-01'},...steps(6)]
  }
];
