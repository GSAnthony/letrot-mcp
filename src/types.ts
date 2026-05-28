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

/**
 * A starter as returned by the live `races/{raceId}/partants` endpoint.
 * (Field names follow the Letrot API, hence the mix of FR/EN.)
 */
export interface Partant {
  id?: string;
  name?: string;
  robe?: string;
  sexe?: string;
  annee?: number;
  age?: number;
  poids?: number;
  crackSeries?: number | string;
  ferrure?: string;
  distance?: number;
  driver?: string;
  driverId?: string;
  coach?: string;
  coachId?: string;
  avisEntraineur?: number;
  song?: string;
  record?: string;
  specialiteRecord?: string;
  earnings?: string;
  earningsAverage?: string;
  leavingNumber?: number;
  rang?: string;
  formattedRank?: string | null;
  rapportProbable?: number;
  favoris?: boolean;
  rankPriority?: number;
  idCasaque?: string;
  nonPartant?: boolean;
}

/** Full response shape of `races/{raceId}/partants`: race metadata + starters. */
export interface RacePartants {
  id?: string;
  raceName?: string;
  numCourse?: number;
  numReunion?: number;
  hippodromeName?: string;
  hippodromeNbr?: string;
  discipline?: string;
  distance?: number;
  allocation?: number;
  countPartant?: number;
  quinte?: boolean;
  pick5?: boolean;
  premium?: boolean;
  partants?: Partant[];
}
