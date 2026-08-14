from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.ai import AIConversation, AIMessage, AIQuery
from app.models.user import User
from app.services.ai_service import ai_orchestrator
from app.services.supabase_auth import verify_supabase_token

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user using Supabase token."""
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    user_id = payload.get("sub")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None
    context: Optional[dict] = None


class SendMessageRequest(BaseModel):
    content: str


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    generated_sql: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new AI conversation."""
    
    conversation = AIConversation(
        organization_id=uuid.uuid4(),  # Using placeholder org ID
        user_id=current_user.id,
        title=request.title or "New Conversation",
        context=request.context
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    # Add system message
    system_message = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content="Hello! I'm your AI assistant. I can help you analyze data, generate SQL queries, and provide insights. How can I assist you today?"
    )
    db.add(system_message)
    await db.commit()
    
    return conversation


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's conversations."""
    
    result = await db.execute(
        select(AIConversation)
        .where(AIConversation.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(AIConversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversation by ID."""
    
    result = await db.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversation messages."""
    
    # Verify conversation ownership
    conv_result = await db.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id
        )
    )
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    result = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send message to AI assistant."""
    
    # Verify conversation ownership
    conv_result = await db.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id
        )
    )
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Save user message
    user_message = AIMessage(
        conversation_id=conversation_id,
        role="user",
        content=request.content
    )
    db.add(user_message)
    await db.flush()
    
    # Get conversation history
    messages_result = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
    )
    history = messages_result.scalars().all()
    
    # Build context
    context_messages = []
    for msg in history[:-1]:  # Exclude the just-added user message
        context_messages.append(f"{msg.role}: {msg.content}")
    
    context = "\n".join(context_messages[-10:])  # Last 10 messages
    
    # Generate AI response
    try:
        system_prompt = """You are a helpful AI assistant for data analysis and business intelligence.
You can help users:
1. Understand their data
2. Generate SQL queries
3. Provide insights and recommendations
4. Answer questions about analytics

Be concise, helpful, and professional."""
        
        full_prompt = f"""Previous conversation:
{context}

User: {request.content}

Respond naturally and helpfully."""
        
        ai_response = await ai_orchestrator.generate_response(
            prompt=full_prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )
        
        # Save assistant message
        assistant_message = AIMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response['content']
        )
        db.add(assistant_message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(assistant_message)
        
        return assistant_message
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )


@router.post("/query")
async def natural_language_query():
    """Process natural language query (placeholder)."""
    return {"sql": "SELECT * FROM table", "results": []}


@router.post("/insights")
async def generate_insights(
    current_user: User = Depends(get_current_user)
):
    """Generate AI insights (placeholder)."""
    return {"insights": []}


@router.post("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user)
):
    """Get AI recommendations (placeholder)."""
    return {"recommendations": []}
