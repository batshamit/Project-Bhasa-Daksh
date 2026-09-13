from fastapi import APIRouter, HTTPException, Depends
from database import get_pending_users, get_all_students, approve_user, reject_user
from routes.auth_routes import require_admin

router = APIRouter()

@router.get('/pending')
def pending_users(user=Depends(require_admin)):
    return get_pending_users()

@router.get('/students')
def all_students(user=Depends(require_admin)):
    return get_all_students()

@router.patch('/{username}/approve')
def approve_student(username: str, user=Depends(require_admin)):
    success = approve_user(username)
    if not success:
        raise HTTPException(status_code=404, detail='User not found or already approved')
    return {'message': 'User approved'}

@router.delete('/{username}')
def reject_student(username: str, user=Depends(require_admin)):
    success = reject_user(username)
    if not success:
        raise HTTPException(status_code=404, detail='User not found')
    return {'message': 'User rejected/deleted'}
