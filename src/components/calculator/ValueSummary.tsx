import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { CalculationBreakdown } from "./CalculationBreakdown";

interface ValueDriver {
  id: string;
  label: string;
  value: number;
  onClick: () => void;
}

interface ValueSummaryProps {
  valueDrivers: ValueDriver[];
  totalValue: number;
  profitValue?: number;
}

export const ValueSummary = ({ valueDrivers, totalValue, profitValue }: ValueSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left side - Value Drivers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Value Drivers</h3>
        <div className="space-y-3">
          {valueDrivers.map((driver) => (
            <Card 
              key={driver.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={driver.onClick}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{driver.label}</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(driver.value)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right side - Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Annual Benefit Potential</p>
              <p className="text-xs text-muted-foreground">(probable)</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </p>
        </Card>

        {profitValue !== undefined && profitValue > 0 && (
          <Card className="p-6 bg-gradient-to-br from-secondary/10 to-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Cost of do nothing per month</p>
                <p className="text-xs text-muted-foreground">(probable)</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-secondary">
              {formatCurrency(profitValue)}
            </p>
          </Card>
        )}

        <Card className="p-4 bg-muted/50">
          <h4 className="font-semibold mb-3">Value category distribution</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Growth</span>
              <span className="font-semibold">{formatCurrency(valueDrivers[0]?.value || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Avoidance</span>
              <span className="font-semibold">{formatCurrency(valueDrivers[1]?.value || 0)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
