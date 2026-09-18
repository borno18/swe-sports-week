import { SportsDirectory } from "@/components/sports-directory";
import { getTournamentData } from "@/lib/tournaments";
export default function SportsPage() { return <SportsDirectory sports={getTournamentData().sports} />; }
