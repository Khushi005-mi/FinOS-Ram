# Imports:
# List, Optional from typing.
# BaseModel, Field from pydantic.
from typing import List, Optional
from pydantic import BaseModel, Field
class ColumnMappingSchema(BaseModel):
 file_name: str = Field(..., alias="fileName")
 source_type: str = Field("GENERAL_LEDGER", alias="sourceType")
 column_mapping: dict = Field(..., alias="columnMapping")

 class Config:
   populate_by_name = True

class BatchUploadResponse(BaseModel):
 batch_id: str = Field(..., alias="batchId")
 status: str 
 success: bool
 file_count: Optional[int] = Field(1, alias="fileCount")
 total_records_ingested: Optional[int] = Field(0, alias="totalRecordsIngested")
 total_debit: Optional[float] = Field(0.0, alias="totalDebit")
 total_credit: Optional[float] = Field(0.0, alias="totalCredit")
 validation_errors: Optional[List[str]] = Field(None, alias="validationErrors")

 class Config: 
   populate_by_name = True