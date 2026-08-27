from typing import List, Optional
from pydantic import BaseModel, Field


class StatementLineItemSchema(BaseModel):
    id: str
    account_code: Optional[str] = Field(None, alias="accountCode")
    account_name: str = Field(..., alias="accountName")
    amount: float
    is_header: Optional[bool] = Field(False, alias="isHeader")
    is_total: Optional[bool] = Field(False, alias="isTotal")

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True


class FinancialStatementResponse(BaseModel):
    organization_name: str = Field(..., alias="organizationName")
    period_name: str = Field(..., alias="periodName")
    currency: str
    revenue: List[StatementLineItemSchema]
    cost_of_sales: List[StatementLineItemSchema] = Field(..., alias="costOfSales")
    operating_expenses: List[StatementLineItemSchema] = Field(..., alias="operatingExpenses")
    total_revenue: float = Field(..., alias="totalRevenue")
    total_cost_of_sales: float = Field(..., alias="totalCostOfSales")
    gross_profit: float = Field(..., alias="grossProfit")
    total_operating_expenses: float = Field(..., alias="totalOperatingExpenses")
    net_income: float = Field(..., alias="netIncome")

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True