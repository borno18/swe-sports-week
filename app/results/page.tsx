import { Results } from "@/components/results";
import { getTournamentData } from "@/lib/tournaments";
export default function ResultsPage() { const { matches, champions } = getTournamentData(); return <Results matches={matches} champions={champions} />; }
