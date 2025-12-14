from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.config import settings
from app.database import init_db
from app.middleware.rate_limit import limiter, RateLimitExceeded
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.api.routes import auth, notes, categories, tags, share, users, todos
from slowapi import _rate_limit_exceeded_handler

# Initialize database
init_db()

app = FastAPI(
    title="Secure Note API",
    description="Secure Note System API with AES-256-GCM encryption",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# Register share router before notes router to ensure /shared routes are matched before /{note_id}
app.include_router(share.router, prefix="/api/notes", tags=["Share"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(todos.router, prefix="/api/todos", tags=["Todos"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/")
async def root():
    return {"message": "Secure Note API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
