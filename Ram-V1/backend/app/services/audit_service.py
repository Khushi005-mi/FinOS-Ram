import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        organization_id: uuid.UUID,
        event_type: str,
        description: str,
        user_id: Optional[uuid.UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        audit_entry = AuditLog(
            id=uuid.uuid4(),
            organization_id=organization_id,
            user_id=user_id,
            event_type=event_type,
            description=description,
            metadata_payload=metadata or {},
        )
        db.add(audit_entry)
        await db.commit()
        return audit_entry
