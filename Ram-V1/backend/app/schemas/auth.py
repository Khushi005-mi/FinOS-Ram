# Imports:
# Optional from typing.
# BaseModel, EmailStr, Field from pydantic.
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
class LoginRequestSchema(BaseModel):
     email: EmailStr
     password: str = Field(..., min_length=6)

class SignupRequestSchema(BaseModel):
     full_name: str = Field(..., min_length=2, max_length=255, alias="fullName")
     company_name: str = Field(..., min_length=2, max_length=255, alias="companyName")
     email: EmailStr
     password: str = Field(..., min_length=6)
     class Config: 
      populate_by_name = True

class UserSessionSchema(BaseModel):
     user_id: str = Field(..., alias="userId")
     email: EmailStr
     organization_id: str = Field(..., alias="organizationId")
     class Config: 
      populate_by_name = True
  
class TokenResponseSchema(BaseModel):
     access_token: str = Field(..., alias="accessToken")
     token_type: str = Field("bearer", alias="tokenType")
     user: UserSessionSchema
     class Config: 
      populate_by_name = True