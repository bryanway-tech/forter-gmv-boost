import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type ChallengeArea = {
  id: string;
  name: string;
  challenges: string[];
  enabled: boolean;
};

interface ChallengeSelectionProps {
  selectedChallenges: { [key: string]: boolean };
  onChallengeChange: (challengeId: string, checked: boolean) => void;
  selectedSolutions: { [key: string]: boolean };
  onSolutionChange: (solutionId: string, checked: boolean) => void;
}

const challengeAreas: ChallengeArea[] = [
  {
    id: "fraud-systems",
    name: "Fraud systems / customer experience",
    challenges: [
      "False fraud declines blocking incremental revenue potential",
      "Rigid rules based fraud system implemented",
      "Manual review process hinders scalability"
    ],
    enabled: true
  },
  {
    id: "payments",
    name: "Payments",
    challenges: [
      "Non-optimized payment funnel process (e.g. high 3DS declines)",
      "Difficulty applying exemptions to reduce friction and improve CX",
      "Unoptimized processor flow (proactive routing)"
    ],
    enabled: true
  },
  {
    id: "chargebacks",
    name: "Chargebacks",
    challenges: [
      "Difficulty in managing and disputing fraud & service chargebacks"
    ],
    enabled: false
  },
  {
    id: "abuse-prevention",
    name: "Abuse Prevention",
    challenges: [
      "Users abusing policies (returns & item not received claims)",
      "Lack customer trust to offer value-add services such as instant refunds",
      "Suffering from promotion abuse",
      "Suffering from reseller/reselling of limited items"
    ],
    enabled: false
  },
  {
    id: "account-identity",
    name: "Account/Identity abuse",
    challenges: [
      "Large number of account takeover (ATO) / hackers",
      "ATO actors causing brand risk - putting downward pressure on CLTV",
      "High risk of sign-up registration abuse",
      "Pressure on CAC due to large number of fraudulent sign-ups"
    ],
    enabled: false
  }
];

const solutions = [
  { id: "fraud-management", name: "Fraud Management", enabled: true },
  { id: "payments-optimization", name: "Payments Optimization", enabled: true },
  { id: "chargeback-recovery", name: "Chargeback Recovery", enabled: false },
  { id: "policy-abuse-prevention", name: "Policy Abuse Prevention", enabled: false },
  { id: "account-protection", name: "Account Protection", enabled: false }
];

export const ChallengeSelection = ({
  selectedChallenges,
  onChallengeChange,
  selectedSolutions,
  onSolutionChange
}: ChallengeSelectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Customer Challenge Areas
          <span className="text-sm text-muted-foreground ml-2">(select relevant challenges to drive tailored solution package)</span>
        </h3>
        
        <div className="space-y-4">
          {challengeAreas.map((area) => (
            <Card key={area.id} className={`p-4 ${!area.enabled ? 'bg-muted/30' : ''}`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                {area.name}
                {!area.enabled && <span className="text-xs text-muted-foreground">(To be added)</span>}
              </h4>
              <div className="space-y-2">
                {area.challenges.map((challenge, idx) => (
                  <div key={`${area.id}-${idx}`} className="flex items-start gap-2">
                    <Checkbox
                      id={`${area.id}-${idx}`}
                      disabled={!area.enabled}
                      checked={selectedChallenges[`${area.id}-${idx}`] || false}
                      onCheckedChange={(checked) => onChallengeChange(`${area.id}-${idx}`, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`${area.id}-${idx}`}
                      className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!area.enabled ? 'text-muted-foreground' : ''}`}
                    >
                      {challenge}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Solution Recommendations</h3>
        <Card className="p-4 bg-slate-700 text-white">
          <p className="text-sm mb-3 italic">Manual over-ride of solutions in note*</p>
          <div className="space-y-2">
            {solutions.map((solution) => (
              <div key={solution.id} className="flex items-center gap-2">
                <Checkbox
                  id={solution.id}
                  disabled={!solution.enabled}
                  checked={selectedSolutions[solution.id] || false}
                  onCheckedChange={(checked) => onSolutionChange(solution.id, checked as boolean)}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-slate-700"
                />
                <Label 
                  htmlFor={solution.id}
                  className={`text-sm ${!solution.enabled ? 'text-gray-400' : ''}`}
                >
                  {solution.name}
                  {!solution.enabled && <span className="ml-2">(To be added)</span>}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
