"""AI orchestration service with automatic fallback."""

import google.generativeai as genai
import httpx
import logging
from typing import Optional, Dict, Any, List
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIProvider(str, Enum):
    """AI provider enum."""
    GEMINI = "gemini"
    GROK = "grok"
    OPENAI = "openai"


class AIOrchestrator:
    """AI orchestration with automatic provider fallback."""
    
    def __init__(self):
        self.providers = []
        
        # Initialize Gemini
        if settings.GOOGLE_GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
                self.providers.append(AIProvider.GEMINI)
                logger.info("Gemini AI initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        
        # Add Grok as fallback
        if settings.GROK_API_KEY:
            self.providers.append(AIProvider.GROK)
            logger.info("Grok AI configured as fallback")
        
        # Add OpenAI as last resort
        if settings.OPENAI_API_KEY:
            self.providers.append(AIProvider.OPENAI)
            logger.info("OpenAI configured as fallback")
    
    async def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """Generate AI response with automatic fallback."""
        
        for provider in self.providers:
            try:
                if provider == AIProvider.GEMINI:
                    response = await self._generate_gemini(prompt, system_prompt, temperature)
                    return {
                        "content": response,
                        "provider": provider.value,
                        "success": True
                    }
                
                elif provider == AIProvider.GROK:
                    response = await self._generate_grok(prompt, system_prompt, temperature, max_tokens)
                    return {
                        "content": response,
                        "provider": provider.value,
                        "success": True
                    }
                
                elif provider == AIProvider.OPENAI:
                    response = await self._generate_openai(prompt, system_prompt, temperature, max_tokens)
                    return {
                        "content": response,
                        "provider": provider.value,
                        "success": True
                    }
                    
            except Exception as e:
                logger.warning(f"{provider.value} failed: {e}. Trying next provider...")
                continue
        
        # All providers failed
        raise Exception("All AI providers failed")
    
    async def _generate_gemini(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float
    ) -> str:
        """Generate response using Google Gemini."""
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        response = self.gemini_model.generate_content(
            full_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
            )
        )
        
        return response.text
    
    async def _generate_grok(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using Grok API."""
        async with httpx.AsyncClient() as client:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            response = await client.post(
                f"{settings.GROK_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "grok-beta",
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                },
                timeout=30.0
            )
            
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using OpenAI (last resort)."""
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content


# Global AI orchestrator instance
ai_orchestrator = AIOrchestrator()


async def generate_sql_from_natural_language(
    question: str,
    schema_info: Dict[str, Any],
    dataset_context: Optional[str] = None
) -> Dict[str, Any]:
    """Convert natural language to SQL query."""
    
    system_prompt = """You are an expert SQL generator for data analytics.
Given a natural language question and database schema, generate a valid SQL query.

Rules:
1. Generate only DuckDB-compatible SQL
2. Use proper aggregations and joins
3. Include appropriate WHERE clauses
4. Return only the SQL query, no explanations
5. Format the query cleanly with proper indentation"""
    
    prompt = f"""Schema Information:
{schema_info}

Dataset Context:
{dataset_context or 'No additional context'}

Question: {question}

Generate a SQL query to answer this question."""
    
    try:
        response = await ai_orchestrator.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )
        
        # Extract SQL from response
        sql = response["content"].strip()
        
        # Clean up markdown code blocks if present
        if sql.startswith("```sql"):
            sql = sql[6:]
        if sql.startswith("```"):
            sql = sql[3:]
        if sql.endswith("```"):
            sql = sql[:-3]
        
        sql = sql.strip()
        
        return {
            "sql": sql,
            "provider": response["provider"],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Failed to generate SQL: {e}")
        return {
            "sql": None,
            "provider": None,
            "success": False,
            "error": str(e)
        }


async def generate_data_insights(
    dataset_summary: Dict[str, Any],
    sample_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate AI insights for a dataset."""
    
    system_prompt = """You are a data analysis expert. Analyze the provided dataset and generate insights.

Focus on:
1. Key trends and patterns
2. Anomalies or outliers
3. Recommendations for visualization
4. Business insights
5. Data quality observations"""
    
    prompt = f"""Dataset Summary:
{dataset_summary}

Sample Data (first 5 rows):
{sample_data[:5]}

Generate comprehensive insights about this dataset."""
    
    try:
        response = await ai_orchestrator.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )
        
        return {
            "insights": response["content"],
            "provider": response["provider"],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Failed to generate insights: {e}")
        return {
            "insights": None,
            "provider": None,
            "success": False,
            "error": str(e)
        }


async def generate_chart_recommendations(
    data_types: Dict[str, str],
    data_sample: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate chart recommendations for data."""
    
    system_prompt = """You are a data visualization expert. Recommend the best charts for the given data.

Respond with JSON format:
{
    "recommended_charts": [
        {
            "chart_type": "bar|line|pie|scatter|area|heatmap|table",
            "reason": "explanation",
            "columns": ["column names to use"],
            "priority": 1-5
        }
    ]
}"""
    
    prompt = f"""Data Types:
{data_types}

Sample Data:
{data_sample[:3]}

Recommend the most suitable visualizations."""
    
    try:
        response = await ai_orchestrator.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.5
        )
        
        import json
        # Try to parse JSON response
        try:
            recommendations = json.loads(response["content"])
        except:
            # If not valid JSON, return raw content
            recommendations = {"raw_response": response["content"]}
        
        return {
            "recommendations": recommendations,
            "provider": response["provider"],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Failed to generate chart recommendations: {e}")
        return {
            "recommendations": None,
            "provider": None,
            "success": False,
            "error": str(e)
        }


async def generate_executive_summary(
    data_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate executive summary from data analysis."""
    
    system_prompt = """You are an executive report writer. Create a concise executive summary.

Format:
- 3-5 key bullet points
- Focus on actionable insights
- Use business language
- Be concise and impactful"""
    
    prompt = f"""Data Analysis Results:
{data_analysis}

Generate an executive summary."""
    
    try:
        response = await ai_orchestrator.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.6
        )
        
        return {
            "summary": response["content"],
            "provider": response["provider"],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        return {
            "summary": None,
            "provider": None,
            "success": False,
            "error": str(e)
        }
