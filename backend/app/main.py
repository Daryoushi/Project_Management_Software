from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.seed import seed_database
from app.routers import auth, workspaces, projects, tasks, dashboard, github

app = FastAPI(
    title="Asana & Jira Style Project Management API",
    description="سیستم جامع مدیریت پروژه با پشتیبانی از چند زبان (فارسی و انگلیسی)، سطوح دسترسی RBAC، تقویم جلالی، کانبان، تایم‌لاین و لیست تسک‌ها",
    version="1.0.0"
)

# Enable CORS for frontend (supports local dev and Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(github.router)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_database()

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Project Management Platform API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
