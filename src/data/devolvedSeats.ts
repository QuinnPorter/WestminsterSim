import type { ListRegion } from './chambers';

/** The eight Scottish Parliament electoral regions and their constituencies, on
 *  the boundaries used since 2011. Seven list seats each; 73 constituencies. */
export const HOLYROOD_CONSTITUENCIES: Record<string, string[]> = {
  central: [
    'Airdrie and Shotts', 'Coatbridge and Chryston', 'Cumbernauld and Kilsyth',
    'East Kilbride', 'Falkirk East', 'Falkirk West',
    'Hamilton, Larkhall and Stonehouse', 'Motherwell and Wishaw', 'Uddingston and Bellshill',
  ],
  glasgow: [
    'Glasgow Anniesland', 'Glasgow Cathcart', 'Glasgow Kelvin',
    'Glasgow Maryhill and Springburn', 'Glasgow Pollok', 'Glasgow Provan',
    'Glasgow Shettleston', 'Glasgow Southside', 'Rutherglen',
  ],
  highlands: [
    'Argyll and Bute', 'Caithness, Sutherland and Ross', 'Inverness and Nairn', 'Moray',
    'Na h-Eileanan an Iar', 'Orkney Islands', 'Shetland Islands', 'Skye, Lochaber and Badenoch',
  ],
  lothian: [
    'Almond Valley', 'Edinburgh Central', 'Edinburgh Eastern', 'Edinburgh Northern and Leith',
    'Edinburgh Pentlands', 'Edinburgh Southern', 'Edinburgh Western', 'Linlithgow',
    'Midlothian North and Musselburgh',
  ],
  midScotland: [
    'Clackmannanshire and Dunblane', 'Cowdenbeath', 'Dunfermline', 'Kirkcaldy',
    'Mid Fife and Glenrothes', 'North East Fife', 'Perthshire North',
    'Perthshire South and Kinross-shire', 'Stirling',
  ],
  northEast: [
    'Aberdeen Central', 'Aberdeen Donside', 'Aberdeen South and North Kincardine',
    'Aberdeenshire East', 'Aberdeenshire West', 'Angus North and Mearns', 'Angus South',
    'Banffshire and Buchan Coast', 'Dundee City East', 'Dundee City West',
  ],
  south: [
    'Ayr', 'Carrick, Cumnock and Doon Valley', 'Clydesdale', 'Dumfriesshire', 'East Lothian',
    'Ettrick, Roxburgh and Berwickshire', 'Galloway and West Dumfries',
    'Kilmarnock and Irvine Valley', 'Midlothian South, Tweeddale and Lauderdale',
  ],
  west: [
    'Clydebank and Milngavie', 'Cunninghame North', 'Cunninghame South', 'Dumbarton',
    'Eastwood', 'Greenock and Inverclyde', 'Paisley', 'Renfrewshire North and West',
    'Renfrewshire South', 'Strathkelvin and Bearsden',
  ],
};

export const HOLYROOD_REGIONS: ListRegion[] = [
  { id: 'central', name: 'Central Scotland', constituencies: 9, listSeats: 7 },
  { id: 'glasgow', name: 'Glasgow', constituencies: 9, listSeats: 7 },
  { id: 'highlands', name: 'Highlands and Islands', constituencies: 8, listSeats: 7 },
  { id: 'lothian', name: 'Lothian', constituencies: 9, listSeats: 7 },
  { id: 'midScotland', name: 'Mid Scotland and Fife', constituencies: 9, listSeats: 7 },
  { id: 'northEast', name: 'North East Scotland', constituencies: 10, listSeats: 7 },
  { id: 'south', name: 'South Scotland', constituencies: 9, listSeats: 7 },
  { id: 'west', name: 'West Scotland', constituencies: 10, listSeats: 7 },
];

/** The five Senedd electoral regions and the forty constituencies used from 1999
 *  to 2021 (the old Westminster boundaries). Four list seats each. */
export const SENEDD_CONSTITUENCIES: Record<string, string[]> = {
  northWales: [
    'Aberconwy', 'Alyn and Deeside', 'Arfon', 'Clwyd South', 'Clwyd West', 'Delyn',
    'Vale of Clwyd', 'Wrexham', 'Ynys Môn',
  ],
  midWest: [
    'Brecon and Radnorshire', 'Carmarthen East and Dinefwr',
    'Carmarthen West and South Pembrokeshire', 'Ceredigion', 'Dwyfor Meirionnydd',
    'Llanelli', 'Montgomeryshire', 'Preseli Pembrokeshire',
  ],
  southWest: [
    'Aberavon', 'Bridgend', 'Gower', 'Neath', 'Ogmore', 'Swansea East', 'Swansea West',
  ],
  southCentral: [
    'Cardiff Central', 'Cardiff North', 'Cardiff South and Penarth', 'Cardiff West',
    'Cynon Valley', 'Pontypridd', 'Rhondda', 'Vale of Glamorgan',
  ],
  southEast: [
    'Blaenau Gwent', 'Caerphilly', 'Islwyn', 'Merthyr Tydfil and Rhymney', 'Monmouth',
    'Newport East', 'Newport West', 'Torfaen',
  ],
};

export const SENEDD_REGIONS: ListRegion[] = [
  { id: 'northWales', name: 'North Wales', constituencies: 9, listSeats: 4 },
  { id: 'midWest', name: 'Mid and West Wales', constituencies: 8, listSeats: 4 },
  { id: 'southWest', name: 'South Wales West', constituencies: 7, listSeats: 4 },
  { id: 'southCentral', name: 'South Wales Central', constituencies: 8, listSeats: 4 },
  { id: 'southEast', name: 'South Wales East', constituencies: 8, listSeats: 4 },
];

/** The sixteen six-member constituencies of the 96-seat Senedd elected from May
 *  2026, each a pairing of two of the 2024 Westminster seats, with the names the
 *  Democracy and Boundary Commission Cymru adopted. */
export const SENEDD_2026_CONSTITUENCIES: { id: string; name: string }[] = [
  { id: 'bangor', name: 'Bangor Conwy Môn' },
  { id: 'clwyd', name: 'Clwyd' },
  { id: 'fflint', name: 'Fflint Wrecsam' },
  { id: 'gwynedd', name: 'Gwynedd Maldwyn' },
  { id: 'ceredigion', name: 'Ceredigion Penfro' },
  { id: 'gaerfyrddin', name: 'Sir Gaerfyrddin' },
  { id: 'gwyr', name: 'Gŵyr Abertawe' },
  { id: 'afan', name: 'Afan Ogwr Rhondda' },
  { id: 'brycheiniog', name: 'Brycheiniog Tawe Nedd' },
  { id: 'penybont', name: 'Pen-y-bont Bro Morgannwg' },
  { id: 'caerdyddPenarth', name: 'Caerdydd Penarth' },
  { id: 'caerdyddTaf', name: 'Caerdydd Ffynnon Taf' },
  { id: 'blaenauGwent', name: 'Blaenau Gwent Caerffili Rhymni' },
  { id: 'casnewydd', name: 'Casnewydd Islwyn' },
  { id: 'fynwy', name: 'Sir Fynwy Torfaen' },
  { id: 'pontypridd', name: 'Pontypridd Cynon Merthyr' },
];

/** The 2026 constituencies that each old region's voters mostly moved into, so a
 *  rebuilt map can inherit the old region's politics rather than a flat average. */
export const SENEDD_2026_FROM_REGION: Record<string, string[]> = {
  northWales: ['bangor', 'clwyd', 'fflint'],
  midWest: ['gwynedd', 'ceredigion', 'gaerfyrddin', 'brycheiniog'],
  southWest: ['gwyr', 'afan', 'penybont'],
  southCentral: ['caerdyddPenarth', 'caerdyddTaf', 'pontypridd'],
  southEast: ['blaenauGwent', 'casnewydd', 'fynwy'],
};
