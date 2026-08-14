#!/usr/bin/env python3
"""Validate configuration and environment variables."""

import sys
import os
from pathlib import Path
from typing import List, Dict, Tuple

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


class ConfigValidator:
    """Validate application configuration."""
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
    
    def validate_required(self, key: str, value: any, description: str):
        """Validate required configuration."""
        if not value or value == "":
            self.errors.append(f"❌ {key}: Missing (Required) - {description}")
            return False
        else:
            self.info.append(f"✅ {key}: Configured")
            return True
    
    def validate_optional(self, key: str, value: any, description: str):
        """Validate optional configuration."""
        if not value or value == "":
            self.warnings.append(f"⚠️  {key}: Not configured (Optional) - {description}")
            return False
        else:
            self.info.append(f"✅ {key}: Configured")
            return True
    
    def validate_placeholder(self, key: str, value: str, placeholders: List[str]):
        """Check if value is still a placeholder."""
        if any(placeholder in str(value).lower() for placeholder in placeholders):
            self.errors.append(f"❌ {key}: Still using placeholder value")
            return False
        return True
    
    def validate_all(self):
        """Run all validations."""
        print("\n" + "="*70)
        print("🔍 SYNORA CONFIGURATION VALIDATION")
        print("="*70 + "\n")
        
        # Database
        print("📊 Database Configuration:")
        self.validate_required(
            "DATABASE_URL",
            settings.DATABASE_URL,
            "PostgreSQL connection string"
        )
        if settings.DATABASE_URL:
            self.validate_placeholder(
                "DATABASE_URL",
                settings.DATABASE_URL,
                ["your-db-password", "localhost:5432/enterprise"]
            )
        
        # Supabase
        print("\n🔐 Supabase Configuration:")
        self.validate_required(
            "SUPABASE_URL",
            settings.SUPABASE_URL,
            "Supabase project URL"
        )
        self.validate_required(
            "SUPABASE_ANON_KEY",
            settings.SUPABASE_ANON_KEY,
            "Supabase anonymous key"
        )
        self.validate_required(
            "SUPABASE_SERVICE_ROLE_KEY",
            settings.SUPABASE_SERVICE_ROLE_KEY,
            "Supabase service role key"
        )
        
        # Redis
        print("\n🔴 Redis Configuration:")
        self.validate_required(
            "REDIS_URL",
            settings.REDIS_URL,
            "Redis connection URL"
        )
        
        # JWT
        print("\n🔑 JWT/Security Configuration:")
        self.validate_required(
            "JWT_SECRET",
            settings.JWT_SECRET,
            "JWT signing secret"
        )
        if settings.JWT_SECRET:
            self.validate_placeholder(
                "JWT_SECRET",
                settings.JWT_SECRET,
                ["your-super-secret", "change-in-production"]
            )
            if len(settings.JWT_SECRET) < 32:
                self.warnings.append(
                    "⚠️  JWT_SECRET: Should be at least 32 characters for security"
                )
        
        # AI Providers
        print("\n🤖 AI Provider Configuration:")
        
        gemini_ok = self.validate_optional(
            "GOOGLE_GEMINI_API_KEY",
            settings.GOOGLE_GEMINI_API_KEY,
            "Google Gemini API (Primary AI)"
        )
        if settings.GOOGLE_GEMINI_API_KEY:
            self.validate_placeholder(
                "GOOGLE_GEMINI_API_KEY",
                settings.GOOGLE_GEMINI_API_KEY,
                ["your-google-gemini", "api-key-here"]
            )
        
        grok_ok = self.validate_optional(
            "GROK_API_KEY",
            settings.GROK_API_KEY,
            "Grok API (Fallback AI)"
        )
        if settings.GROK_API_KEY:
            self.validate_placeholder(
                "GROK_API_KEY",
                settings.GROK_API_KEY,
                ["your-grok", "api-key-here"]
            )
        
        openai_ok = self.validate_optional(
            "OPENAI_API_KEY",
            settings.OPENAI_API_KEY,
            "OpenAI API (Optional Fallback)"
        )
        if settings.OPENAI_API_KEY:
            self.validate_placeholder(
                "OPENAI_API_KEY",
                settings.OPENAI_API_KEY,
                ["your-openai", "api-key-here"]
            )
        
        if not (gemini_ok or grok_ok or openai_ok):
            self.errors.append(
                "❌ AI_PROVIDERS: No AI provider configured! "
                "Configure at least one: Gemini (recommended), Grok, or OpenAI"
            )
        
        # File paths
        print("\n📁 File System Configuration:")
        duckdb_path = Path(settings.DUCKDB_PATH)
        if not duckdb_path.parent.exists():
            self.warnings.append(
                f"⚠️  DUCKDB_PATH: Directory does not exist: {duckdb_path.parent}"
            )
        else:
            self.info.append(f"✅ DUCKDB_PATH: {settings.DUCKDB_PATH}")
        
        upload_dir = Path(settings.UPLOAD_DIR)
        if not upload_dir.exists():
            self.warnings.append(
                f"⚠️  UPLOAD_DIR: Directory does not exist: {upload_dir}"
            )
        else:
            self.info.append(f"✅ UPLOAD_DIR: {settings.UPLOAD_DIR}")
        
        # Environment
        print("\n⚙️  Application Configuration:")
        self.info.append(f"✅ APP_ENV: {settings.APP_ENV}")
        self.info.append(f"✅ API_PORT: {settings.API_PORT}")
        self.info.append(f"✅ LOG_LEVEL: {settings.LOG_LEVEL}")
        
        # Print results
        self._print_results()
        
        # Return exit code
        return 0 if len(self.errors) == 0 else 1
    
    def _print_results(self):
        """Print validation results."""
        print("\n" + "="*70)
        print("📋 VALIDATION SUMMARY")
        print("="*70 + "\n")
        
        if self.errors:
            print("❌ ERRORS (must be fixed):")
            for error in self.errors:
                print(f"  {error}")
            print()
        
        if self.warnings:
            print("⚠️  WARNINGS (should be addressed):")
            for warning in self.warnings:
                print(f"  {warning}")
            print()
        
        print(f"✅ {len(self.info)} configuration items validated")
        
        if not self.errors and not self.warnings:
            print("\n🎉 Configuration is complete and valid!")
        elif not self.errors:
            print("\n✅ Configuration is valid (with warnings)")
        else:
            print(f"\n❌ Configuration has {len(self.errors)} error(s) that must be fixed")
        
        print("="*70 + "\n")


def main():
    """Main entry point."""
    validator = ConfigValidator()
    return validator.validate_all()


if __name__ == "__main__":
    sys.exit(main())
