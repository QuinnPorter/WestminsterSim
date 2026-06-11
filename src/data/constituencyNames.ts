import { RegionId } from '../types/game';

interface NamePool {
  stems: string[];
  /** chance a directional/feature suffix is appended */
  suffixes: string[];
}

export const CONSTITUENCY_POOLS: Record<RegionId, NamePool> = {
  scotland: {
    stems: ['Aberlour', 'Invergale', 'Kilmorack', 'Dunbrae', 'Glenrothan',
      'Strathearn', 'Lochinver', 'Carnoustie', 'Balmore', 'Kirkfield',
      'Ardmuir', 'Cullenbay', 'Pitlochan', 'Tayford', 'Eskmount',
      'Braewick', 'Monthill', 'Garvald', 'Drumnadroch', 'Foyersdale'],
    suffixes: ['North', 'South', 'East', 'West', 'and Glens', 'and Deeside',
      'Coast', 'and the Isles'],
  },
  wales: {
    stems: ['Llanmorgan', 'Aberfawr', 'Pontydre', 'Cwmgelli', 'Brynmawr Vale',
      'Caerwyn', 'Penrhos', 'Tregaron', 'Maesteg Fach', 'Glyncorrwg',
      'Llandewi', 'Aberystwen', 'Pontnedd', 'Cwmrhondda', 'Brynteg'],
    suffixes: ['North', 'South', 'East', 'West', 'and Valleys', 'Uplands', 'Coast'],
  },
  ni: {
    stems: ['Ballygowan', 'Carrickmore', 'Dunmurry', 'Strabane Hills',
      'Lisnaskea', 'Maghera Vale', 'Crossharbour', 'Killyleagh',
      'Ardstraw', 'Toomebridge', 'Glenshane', 'Banbridge Fields'],
    suffixes: ['North', 'South', 'East', 'West', 'and Mournes', 'Valley'],
  },
  london: {
    stems: ['Camberford', 'Hollowgate', 'Bermondhithe', 'Eastfield Park',
      'Wandlemere', 'Hackbridge', 'Tottenham Rise', 'Brockwell',
      'Limehaven', 'Norbury Heath', 'Peckfield', 'Stokewell',
      'Charlton Vale', 'Ealingbrook', 'Finchmore'],
    suffixes: ['North', 'South', 'East', 'West', 'Central', 'and Riverside'],
  },
  southEast: {
    stems: ['Amberhurst', 'Chalkdown', 'Farleybridge', 'Godalbury',
      'Hartingdean', 'Maidenford', 'Oakhanger', 'Petersmead',
      'Roughwood', 'Saltdean Vale', 'Thamesfield', 'Wealdhurst',
      'Bexworth', 'Cranleigh Heath', 'Duncombe'],
    suffixes: ['North', 'South', 'East', 'West', 'and Downs', 'Weald', 'Coast'],
  },
  southWest: {
    stems: ['Avonleigh', 'Bodmoor', 'Camelford Vale', 'Dartcombe',
      'Exminster', 'Frome Valley', 'Glastonhill', 'Kingsbridge Hundred',
      'Lyme Regis Bay', 'Mendip Edge', 'Porthlowan', 'Quantock Vale',
      'Salcombe Water', 'Tavybridge', 'Wellsworth'],
    suffixes: ['North', 'South', 'East', 'West', 'and Moor', 'Coast', 'Vale'],
  },
  east: {
    stems: ['Brecklands', 'Caxton Fen', 'Dedham Vale', 'Elmswell',
      'Framlingford', 'Gippingford', 'Harlow Marsh', 'Icknield',
      'Lavenham Brook', 'Martlesham', 'Naseby Fen', 'Orwell Bridge',
      'Saffron Hundred', 'Thetwood', 'Waveney Edge'],
    suffixes: ['North', 'South', 'East', 'West', 'and Fens', 'Broads', 'Vale'],
  },
  eastMidlands: {
    stems: ['Asherby', 'Beltonfield', 'Carsington', 'Dovebridge',
      'Eyam Edge', 'Foxlow', 'Granthorpe', 'Hathersedge',
      'Ketteringham', 'Lutterwell', 'Melburn Mowbray', 'Nethercroft',
      'Oakthorpe', 'Rutland Brook', 'Sherwood Rise'],
    suffixes: ['North', 'South', 'East', 'West', 'and Wolds', 'Vale', 'Forest'],
  },
  westMidlands: {
    stems: ['Aldergate', 'Bridgnorth Vale', 'Coalbrook', 'Dudfield',
      'Edgbastow', 'Fenny Heath', 'Hagleymere', 'Kenilbourne',
      'Ludstone', 'Mercia Fields', 'Nuneham', 'Oswaldtree',
      'Perry Holt', 'Solihampton', 'Wrekin Edge'],
    suffixes: ['North', 'South', 'East', 'West', 'Central', 'and Heath'],
  },
  northWest: {
    stems: ['Accringfield', 'Birkenmere', 'Cloughdale', 'Darwen Edge',
      'Ecclesbourne', 'Furness Gate', 'Grizebeck', 'Heywood Marsh',
      'Irwell Bank', 'Kirkby Lonsdale', 'Lythamshore', 'Morecombe Rise',
      'Nelsonthwaite', 'Ormswick', 'Pendlebrook'],
    suffixes: ['North', 'South', 'East', 'West', 'and Dales', 'Moor', 'Coast'],
  },
  northEast: {
    stems: ['Alnwickdale', 'Bedeburn', 'Consett Edge', 'Durhamgate',
      'Easingwold Moor', 'Felling Bank', 'Gosforth Rise', 'Hartlemouth',
      'Jarrowfield', 'Kielder Vale', 'Lindisfield', 'Marsdenshore',
      'Prudholme', 'Rydonside', 'Wearbridge'],
    suffixes: ['North', 'South', 'East', 'West', 'and Tyne', 'Coast', 'Vale'],
  },
  yorkshire: {
    stems: ['Aysgarthorpe', 'Bramwith', 'Calderbeck', 'Dentondale',
      'Elmet Rise', 'Farsleybridge', 'Grimsthorpe', 'Holmewath',
      'Ilkleymoor', 'Keldgate', 'Lofthouse Edge', 'Maltbywell',
      'Niddervale', 'Ousebank', 'Pontebrook'],
    suffixes: ['North', 'South', 'East', 'West', 'and Dales', 'Moor', 'Wolds'],
  },
};
