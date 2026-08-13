from typing import List, Optional
from pydantic import BaseModel, Field


class KpiMetricSchema(BaseModel):
    title: str
    value: str
    change_percentage: float = Field(..., alias="changePercentage")
    trend: str
    is_positive: bool = Field(..., alias="isPositive")
    description: str

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True


class DashboardMetricsResponse(BaseModel):
    revenue: KpiMetricSchema
    cogs: KpiMetricSchema
    gross_margin: KpiMetricSchema = Field(..., alias="grossMargin")
    ebitda: KpiMetricSchema

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True


class MonthlyTrendPointSchema(BaseModel):
    month: str
    revenue: float
    cogs: float
    gross_profit: float = Field(..., alias="grossProfit")
    operating_margin: float = Field(..., alias="operatingMargin")

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True


class ExecutiveInsightSchema(BaseModel):
    id: str
    type: str
    title: str
    summary: str

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True