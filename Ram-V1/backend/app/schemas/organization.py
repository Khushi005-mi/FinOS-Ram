from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OrganizationCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry_type: str = Field("GENERAL_SMB", alias="industryType")
    currency: str = Field("USD", min_length=3, max_length=10)
    fiscal_year_start: int = Field(1, alias="fiscalYearStart")

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True


class OrganizationResponseSchema(BaseModel):
    id: str
    name: str
    slug: str
    industry_type: str = Field(..., alias="industryType")
    currency: str
    fiscal_year_start: int = Field(..., alias="fiscalYearStart")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True
        orm_mode = True