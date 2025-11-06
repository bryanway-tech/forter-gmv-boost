import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CalculationBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  calculations: {
    label: string;
    value: string | number;
    formula?: string;
    isResult?: boolean;
  }[];
}

export const CalculationBreakdown = ({
  open,
  onOpenChange,
  title,
  calculations,
}: CalculationBreakdownProps) => {
  const formatValue = (value: string | number) => {
    if (typeof value === "number") {
      if (value > 1000) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detailed breakdown of how this metric is calculated
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {calculations.map((calc, index) => (
              <div key={index}>
                <div
                  className={`flex justify-between items-start gap-4 ${
                    calc.isResult ? "font-bold text-lg" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className={calc.isResult ? "text-primary" : ""}>
                      {calc.label}
                    </div>
                    {calc.formula && (
                      <div className="text-xs text-muted-foreground font-mono mt-1 bg-muted p-2 rounded">
                        {calc.formula}
                      </div>
                    )}
                  </div>
                  <div className={`text-right ${calc.isResult ? "text-primary" : ""}`}>
                    {formatValue(calc.value)}
                  </div>
                </div>
                {!calc.isResult && index < calculations.length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
