import { SportsDirectory } from "@/components/sports-directory";
import { getTournamentData } from "@/lib/tournaments";

export default async function SportsPage() {
  const { sports } = await getTournamentData();
  return <SportsDirectory sports={sports} />;
}
