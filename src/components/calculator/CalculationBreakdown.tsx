import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CalculationBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  columns?: string[]; // For multi-column layout e.g., ["Current", "Impact", "Forter"]
  calculations: {
    label: string;
    value?: string | number; // Single column value (backward compatible)
    currentValue?: string | number; // Multi-column values
    impactValue?: string | number;
    forterValue?: string | number;
    formula?: string;
    isResult?: boolean;
    isHeader?: boolean;
    isSubheader?: boolean;
    isBad?: boolean; // For negative metrics like declines
  }[];
}

export const CalculationBreakdown = ({
  open,
  onOpenChange,
  title,
  columns,
  calculations,
}: CalculationBreakdownProps) => {
  const isMultiColumn = columns && columns.length > 0;

  const formatValue = (value: string | number | undefined) => {
    if (value === undefined || value === null) return "";
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

  const formatImpact = (impact: string | number | undefined) => {
    if (impact === undefined || impact === null) return "";
    const str = String(impact);
    
    // Check for zero values - return without + sign
    if (str === "$0" || str === "0" || str === "0%" || str === "0.00%" || str === "+0" || str === "+$0" || str === "+0%") {
      return str.replace("+", ""); // Remove + if present
    }
    
    // If it already has a sign, return as is
    if (str.startsWith("+") || str.startsWith("-")) return str;
    
    // Add + for positive numbers
    if (typeof impact === "number" && impact > 0) return `+${formatValue(impact)}`;
    if (typeof impact === "string" && !str.startsWith("-")) return `+${str}`;
    
    return str;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detailed breakdown of how this metric is calculated
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isMultiColumn ? (
            <div className="space-y-2">
              {/* Column Headers */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-center py-4 border-b-2 border-primary/20 font-bold text-base bg-background px-2 rounded-t sticky top-0 z-10">
                <div>Metric</div>
                <div className="text-right">{columns[0]}</div>
                <div className="text-right">{columns[1]}</div>
                <div className="text-right">{columns[2]}</div>
              </div>
              {calculations.map((calc, index) => {
                if (calc.isHeader) {
                  return (
                    <div key={index} className="text-center font-bold text-primary text-lg pt-4 pb-2 border-b">
                      {calc.label}
                    </div>
                  );
                }
                
                if (calc.isSubheader) {
                  return (
                    <div key={index} className="font-semibold text-sm text-muted-foreground pt-3 pb-1 uppercase tracking-wide bg-muted/30 px-2 py-1 rounded">
                      {calc.label}
                    </div>
                  );
                }
                
                return (
                  <div key={index}>
                    <div className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-center py-2 ${calc.isResult ? "font-bold text-base border-t-2 border-primary pt-3" : ""}`}>
                      <div className={`${calc.isResult ? "text-primary" : ""}`}>
                        {calc.label}
                        {calc.formula && (
                          <div className="text-xs text-muted-foreground font-mono mt-1 bg-muted/50 p-1 rounded">
                            {calc.formula}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-foreground">
                        {formatValue(calc.currentValue)}
                      </div>
                      <div className={`text-right font-medium ${
                        (() => {
                          const impactStr = String(calc.impactValue);
                          // Neutral values (N/A, 0, empty)
                          if (!impactStr || impactStr === "N/A" || impactStr === "0" || impactStr === "$0" || impactStr === "0.00%" || impactStr === "+0" || impactStr === "+$0") {
                            return "text-foreground";
                          }
                          // For "bad" metrics (declines, abandonment), negative is favorable (green)
                          if (calc.isBad) {
                            return impactStr.includes("-") 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-destructive";
                          }
                          // For normal metrics, positive is favorable (green)
                          return impactStr.includes("-") 
                            ? "text-destructive" 
                            : "text-green-600 dark:text-green-400";
                        })()
                      }`}>
                        {formatImpact(calc.impactValue)}
                      </div>
                      <div className="text-right text-foreground">
                        {formatValue(calc.forterValue)}
                      </div>
                    </div>
                    {!calc.isResult && !calc.isHeader && !calc.isSubheader && index < calculations.length - 1 && !calculations[index + 1]?.isHeader && !calculations[index + 1]?.isSubheader && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {calculations.map((calc, index) => {
                if (calc.isHeader) {
                  return (
                    <div key={index} className="text-center font-bold text-primary text-lg pt-4 pb-2">
                      {calc.label}
                    </div>
                  );
                }
                
                if (calc.isSubheader) {
                  return (
                    <div key={index} className="font-semibold text-sm text-muted-foreground pt-3 pb-1 uppercase tracking-wide">
                      {calc.label}
                    </div>
                  );
                }
                
                return (
                  <div key={index}>
                    <div
                      className={`flex justify-between items-start gap-4 ${
                        calc.isResult ? "font-bold text-lg pt-2" : ""
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
                      <div className={`text-right whitespace-nowrap ${calc.isResult ? "text-primary" : ""}`}>
                        {formatValue(calc.value)}
                      </div>
                    </div>
                    {!calc.isResult && !calc.isHeader && !calc.isSubheader && index < calculations.length - 1 && !calculations[index + 1]?.isHeader && !calculations[index + 1]?.isSubheader && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
