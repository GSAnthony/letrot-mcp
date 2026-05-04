export interface RaceSummary {
  id?: string;
  _id?: string;
  numCourse?: number;
  heureCourse?: string;
  heure?: string;
  statut?: number;
  discipline?: string;
  prix?: string;
  quinte?: boolean;
  pick5?: boolean;
  premium?: boolean;
}

export interface MeetingSummary {
  id?: string | number;
  numReunion?: number;
  nomHippodrome?: string;
  hippodrome?: string;
  heureReunion?: string;
  heure?: string;
  premium?: boolean;
  quinte?: boolean;
  pick5?: boolean;
  races?: RaceSummary[];
  courses?: RaceSummary[];
}

export interface MeetingsProgram {
  date: string;
  meetings: unknown;
}

export interface Partant {
  numSire?: string;
  nomCheval?: string;
  libelleJockey?: string;
  libelleEntraineur?: string;
  ferrure?: string;
  distance?: number;
  poids?: number;
  musique?: string;
  record?: string;
  specialiteRecord?: string;
  gain?: number;
  gainsMoyensFr?: number;
  crackSeries?: number;
  avisEntraineur?: number;
  rapportProbable?: number;
  ordre?: number;
  rang?: string;
  nonPartant?: boolean;
}

export interface CourseHippodrome {
  prix?: string;
  nomHippodrome?: string;
  numCourse?: number;
  heureCourse?: string;
  distance?: number;
  allocation?: number;
  statut?: number;
  discipline?: string;
  partantList?: Partant[];
  countPartant?: number;
}

export interface RaceDocument {
  _id: string;
  courseHippodrome: CourseHippodrome;
}
