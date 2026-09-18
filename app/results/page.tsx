import { Results } from "@/components/results";
import { getTournamentData } from "@/lib/tournaments";

export default async function ResultsPage() {
  const { matches, champions } = await getTournamentData();
  return <Results matches={matches} champions={champions} />;
}
