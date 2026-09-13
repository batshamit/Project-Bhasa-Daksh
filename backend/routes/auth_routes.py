from fastapi import APIRouter, HTTPException, Depends, Header
from models import LoginRequest, RegisterRequest
from database import get_user, add_user
from auth import create_token, decode_token

router = APIRouter()

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Not authenticated')
    token = authorization.split(' ')[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    return payload

def require_admin(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    return user

from pydantic import BaseModel

class LanguageUpdate(BaseModel):
    language: str

@router.post('/login')
def login(req: LoginRequest):
    user = get_user(req.username)
    if not user or user['password'] != req.password:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    if user['status'] == 'pending':
        raise HTTPException(status_code=403, detail='Account pending admin approval')
    if user['status'] == 'rejected':
        raise HTTPException(status_code=403, detail='Registration not approved')
    token = create_token(user['username'], user['role'])
    return {'token': token, 'user': {'username': user['username'], 'name': user['name'], 'role': user['role'], 'preferred_language': user.get('preferred_language', 'English')}}

@router.post('/register')
def register(req: RegisterRequest):
    success = add_user(req.username, req.password, req.name, preferred_language=req.preferred_language or 'Hindi')
    if not success:
        raise HTTPException(status_code=409, detail='Username already exists')
    return {'message': 'Registration successful. Awaiting admin approval.'}

@router.get('/me')
def get_me(user=Depends(get_current_user)):
    user_data = get_user(user['username'])
    if not user_data:
        raise HTTPException(status_code=404, detail='User not found')
    return {'username': user_data['username'], 'name': user_data['name'], 'role': user_data['role'], 'preferred_language': user_data.get('preferred_language', 'English')}

@router.patch('/language')
def update_language(req: LanguageUpdate, user=Depends(get_current_user)):
    from database import update_user_language
    update_user_language(user['username'], req.language)
    return {'message': 'Language updated', 'preferred_language': req.language}
