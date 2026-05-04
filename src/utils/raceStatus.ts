export type RaceStatus =
  | "ENGAGED"
  | "REMAINING"
  | "STOPPED"
  | "TIMER"
  | "UPCOMING"
  | "FALSE_START"
  | "IN_PROGRESS"
  | "PROVISORY"
  | "DEFINITIVE"
  | "CANCELED"
  | "INCOMING";

export function getStatusByCode(code: number | null | undefined): RaceStatus {
  if (code === 100) return "ENGAGED";
  if (code === 200) return "REMAINING";
  if (code === 1) return "STOPPED";
  if (code === 2 || code === 3 || code === 4) return "TIMER";
  if (code === 5 || code === 6) return "UPCOMING";
  if (code === 7) return "FALSE_START";
  if (code === 8) return "IN_PROGRESS";
  if (code === 10 || code === 11 || code === 12 || code === 13) return "PROVISORY";
  if (code === 14 || code === 15 || code === 16) return "DEFINITIVE";
  if (code === 17) return "CANCELED";
  return "INCOMING";
}

export function statusLabel(status: RaceStatus): string {
  switch (status) {
    case "ENGAGED":     return "Engagés";
    case "REMAINING":   return "Restants";
    case "STOPPED":     return "Arrêtée";
    case "TIMER":       return "Avant départ";
    case "UPCOMING":    return "À venir";
    case "FALSE_START": return "Faux départ";
    case "IN_PROGRESS": return "En cours";
    case "PROVISORY":   return "Provisoire";
    case "DEFINITIVE":  return "Définitive";
    case "CANCELED":    return "Annulée";
    case "INCOMING":    return "À venir";
  }
}
