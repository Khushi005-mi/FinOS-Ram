from datetime import datetime
from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreateSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str = Field(..., min_length=2, max_length=255)
    industry_type: str = Field("GENERAL_SMB", alias="industryType")
    currency: str = Field("USD", min_length=3, max_length=10)
    fiscal_year_start: int = Field(1, alias="fiscalYearStart")


class OrganizationResponseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: Union[str, UUID]
    name: str
    slug: str
    industry_type: str = Field(..., alias="industryType")
    currency: str
    fiscal_year_start: int = Field(..., alias="fiscalYearStart")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")