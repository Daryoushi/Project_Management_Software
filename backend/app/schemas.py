from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    global_role: str = "member" # super_admin, admin, project_manager, member, viewer
    preferred_lang: str = "fa"
    theme: str = "light"

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    global_role: Optional[str] = "member"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "Briefcase"
    color: Optional[str] = "#4F46E5"

class WorkspaceMemberAdd(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "member" # owner, admin, project_manager, member, viewer

class ProjectCreate(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "FolderKanban"
    color: Optional[str] = "#6366F1"

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"
    section: Optional[str] = "To do"
    priority: Optional[str] = "medium"
    assignee_id: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = 0
    tags: Optional[List[dict]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    section: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    position: Optional[int] = None
    estimated_hours: Optional[float] = None
    tags: Optional[List[dict]] = None

class SubtaskCreate(BaseModel):
    title: str

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None

class CommentCreate(BaseModel):
    content: str

class AttachmentCreate(BaseModel):
    file_name: str
    file_size: str
    file_url: str
    file_type: Optional[str] = "image"
