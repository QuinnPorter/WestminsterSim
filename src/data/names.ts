import { Gender, RegionId } from '../types/game';

export const FIRST_M = [
  'James', 'Oliver', 'Tom', 'Daniel', 'Matthew', 'Andrew', 'Richard', 'Paul',
  'Mark', 'Stephen', 'David', 'Robert', 'Michael', 'Peter', 'Simon', 'Chris',
  'Jonathan', 'Nicholas', 'Edward', 'William', 'Henry', 'George', 'Alistair',
  'Gordon', 'Douglas', 'Ewan', 'Callum', 'Fraser', 'Hamish', 'Rhys', 'Gareth',
  'Owen', 'Dylan', 'Imran', 'Sajid', 'Rishi', 'Amar', 'Tariq', 'Raj', 'Dev',
  'Kwasi', 'Kemi—', 'Samuel', 'Joshua', 'Adam', 'Ben', 'Jack', 'Harry',
  'Liam', 'Nathan', 'Marcus', 'Darren', 'Lee', 'Wayne', 'Dean', 'Jordan',
  'Aleksander', 'Tomasz', 'Stefan', 'Wei', 'Jin', 'Kofi', 'Femi', 'Tunde',
].filter((n) => !n.includes('—'));

export const FIRST_F = [
  'Sarah', 'Emma', 'Rachel', 'Claire', 'Lucy', 'Hannah', 'Laura', 'Rebecca',
  'Catherine', 'Elizabeth', 'Victoria', 'Charlotte', 'Alice', 'Helen', 'Jane',
  'Anna', 'Margaret', 'Fiona', 'Morag', 'Isla', 'Eilidh', 'Kirsty', 'Mhairi',
  'Carys', 'Bethan', 'Ffion', 'Nia', 'Seren', 'Priya', 'Anita', 'Shabana',
  'Nadia', 'Yasmin', 'Zara', 'Meera', 'Amara', 'Chioma', 'Abena', 'Mei',
  'Grace', 'Sophie', 'Chloe', 'Jess', 'Katie', 'Holly', 'Amy', 'Gemma',
  'Stacey', 'Kelly', 'Donna', 'Tracey', 'Lisa', 'Karen', 'Angela', 'Diane',
  'Agnieszka', 'Kasia', 'Elena', 'Ingrid',
];

export const FIRST_NB = [
  'Alex', 'Sam', 'Jo', 'Charlie', 'Frankie', 'Robin', 'Ash', 'Morgan',
  'Riley', 'Jules', 'Rowan', 'Kit', 'Blair', 'Devon',
];

export const SURNAMES = [
  'Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson',
  'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White',
  'Roberts', 'Green', 'Hall', 'Wood', 'Jackson', 'Clarke', 'Harris',
  'Lewis', 'Clark', 'Young', 'Hill', 'Moore', 'Allen', 'King', 'Baker',
  'Carter', 'Mitchell', 'Turner', 'Parker', 'Collins', 'Edwards', 'Morris',
  'Cooper', 'Ward', 'Bennett', 'Cox', 'Gray', 'Richardson', 'Hughes',
  'Foster', 'Bell', 'Murphy', 'Kelly', 'Bailey', 'Webb', 'Chapman',
  'Holmes', 'Mills', 'Palmer', 'Barnes', 'Knight', 'Stevens', 'Dixon',
  'Fletcher', 'Page', 'Hunt', 'Berry', 'Stone', 'Hart', 'Pearce', 'Lane',
  // Scottish
  'MacDonald', 'Campbell', 'Stewart', 'Robertson', 'MacLeod', 'Fraser',
  'Murray', 'Cameron', 'Ferguson', 'Grant', 'Sinclair', 'Buchanan',
  // Welsh
  'Llewellyn', 'Griffiths', 'Pritchard', 'Vaughan', 'Bevan', 'Owens',
  // Irish
  "O'Brien", "O'Connor", 'Gallagher', 'Doyle', 'Brennan', 'Nolan',
  // South Asian
  'Khan', 'Patel', 'Singh', 'Ahmed', 'Hussain', 'Sharma', 'Begum', 'Malik',
  'Chaudhry', 'Iqbal', 'Kaur', 'Rahman',
  // Black British / African / Caribbean
  'Okafor', 'Adeyemi', 'Mensah', 'Osei', 'Boateng', 'Abara', 'Francis',
  'Grant-Pierre', 'Samuels', 'Lindo',
  // East Asian
  'Chen', 'Wong', 'Li', 'Zhang', 'Kim', 'Tanaka', 'Nguyen',
  // Eastern European
  'Kowalski', 'Nowak', 'Petrov', 'Novak', 'Kovacs', 'Horvat',
  // Other
  'Costa', 'Rossi', 'Dubois', 'Schmidt', 'Andersson', 'Papadopoulos',
];

/** surnames that get extra weight per region (subtle regional flavour) */
export const REGIONAL_SURNAMES: Partial<Record<RegionId, string[]>> = {
  scotland: ['MacDonald', 'Campbell', 'Stewart', 'Robertson', 'MacLeod',
    'Fraser', 'Murray', 'Cameron', 'Ferguson', 'Grant', 'Sinclair', 'Buchanan'],
  wales: ['Davies', 'Evans', 'Williams', 'Jones', 'Llewellyn', 'Griffiths',
    'Pritchard', 'Vaughan', 'Bevan', 'Owens', 'Roberts'],
  ni: ["O'Brien", "O'Connor", 'Gallagher', 'Doyle', 'Brennan', 'Nolan',
    'Murphy', 'Kelly', 'Campbell'],
};

export const REGIONAL_FIRST_M: Partial<Record<RegionId, string[]>> = {
  scotland: ['Ewan', 'Callum', 'Fraser', 'Hamish', 'Gordon', 'Douglas', 'Alistair'],
  wales: ['Rhys', 'Gareth', 'Owen', 'Dylan'],
};

export const REGIONAL_FIRST_F: Partial<Record<RegionId, string[]>> = {
  scotland: ['Fiona', 'Morag', 'Isla', 'Eilidh', 'Kirsty', 'Mhairi'],
  wales: ['Carys', 'Bethan', 'Ffion', 'Nia', 'Seren'],
};

export function firstNamePool(gender: Gender): string[] {
  return gender === 'm' ? FIRST_M : gender === 'f' ? FIRST_F : FIRST_NB;
}
