from fastapi import APIRouter, HTTPException, Depends
from models import MarkComplete
from database import mark_module_complete, get_completed_modules
from routes.auth_routes import get_current_user

router = APIRouter()

@router.post('/complete')
def mark_complete(req: MarkComplete, user=Depends(get_current_user)):
    success = mark_module_complete(user['username'], req.module_id)
    if not success:
        raise HTTPException(status_code=400, detail='Failed to mark complete')
    return {'message': 'Module marked as complete'}

@router.get('/{username}')
def completed_modules(username: str, user=Depends(get_current_user)):
    return get_completed_modules(username)
