# import DeclarativeBase from sqlalchemy.orm.
from sqlalchemy.orm import DeclarativeBase
# Create class Base(DeclarativeBase) — this is the base class that all database models will inherit from.
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    Provides declarative class definitions and meta-data mapping.
    """
    pass