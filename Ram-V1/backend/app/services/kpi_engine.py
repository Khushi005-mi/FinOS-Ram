from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any

class KPICalculationEngine:
    """
    Centralized Exact-Decimal Financial Calculation Engine for FinOS.
    Guarantees a Single Source of Truth for all derived financial ratios and outputs.
    """
    
    @staticmethod
    def _quantize(val: Decimal) -> Decimal:
        return val.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    @classmethod
    def compute_metrics(
        cls,
        revenue: Decimal,
        expenses: Decimal,
        cash: Decimal,
        debt: Decimal,
        accounts_receivable: Decimal,
        accounts_payable: Decimal,
        previous_period_revenue: Decimal = Decimal("0.00")
    ) -> Dict[Any, Any]:
        
        rev = Decimal(str(revenue))
        exp = Decimal(str(expenses))
        csh = Decimal(str(cash))
        dbt = Decimal(str(debt))
        ar = Decimal(str(accounts_receivable))
        ap = Decimal(str(accounts_payable))
        prev_rev = Decimal(str(previous_period_revenue))

        gross_profit = rev - exp
        profit_margin = (gross_profit / rev * Decimal("100")) if rev > 0 else Decimal("0.00")
        expense_ratio = (exp / rev * Decimal("100")) if rev > 0 else Decimal("0.00")
        
        if prev_rev > 0:
            growth_rate = ((rev - prev_rev) / prev_rev) * Decimal("100")
        else:
            growth_rate = Decimal("0.00")

        working_capital = csh + ar - ap
        debt_ratio = (dbt / csh) if csh > 0 else Decimal("0.00")

        return {
            "revenue": cls._quantize(rev),
            "expenses": cls._quantize(exp),
            "gross_profit": cls._quantize(gross_profit),
            "net_profit": cls._quantize(gross_profit),
            "profit_margin_percent": cls._quantize(profit_margin),
            "expense_ratio_percent": cls._quantize(expense_ratio),
            "revenue_growth_percent": cls._quantize(growth_rate),
            "cash_flow": cls._quantize(csh),
            "working_capital": cls._quantize(working_capital),
            "debt_to_cash_ratio": cls._quantize(debt_ratio),
            "health_status": "OPTIMAL" if gross_profit > 0 and working_capital > 0 else "CAUTION"
        }
