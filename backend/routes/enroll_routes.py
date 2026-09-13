from fastapi import APIRouter, HTTPException, Depends
from models import EnrollRequest
from database import get_enrolled_courses, enroll_student, unenroll_student, get_enrolled_students
from routes.auth_routes import get_current_user, require_admin

router = APIRouter()

@router.get('/{username}')
def enrolled_courses(username: str, user=Depends(get_current_user)):
    return get_enrolled_courses(username)

@router.post('/')
def enroll(req: EnrollRequest, user=Depends(require_admin)):
    success = enroll_student(req.username, req.course_id)
    if not success:
        raise HTTPException(status_code=400, detail='Enrollment failed (user/course might not exist or already enrolled)')
    return {'message': 'Enrolled successfully'}

@router.delete('/')
def unenroll(req: EnrollRequest, user=Depends(require_admin)):
    success = unenroll_student(req.username, req.course_id)
    if not success:
        raise HTTPException(status_code=400, detail='Unenrollment failed')
    return {'message': 'Unenrolled successfully'}

@router.get('/course/{course_id}')
def enrolled_students(course_id: str, user=Depends(require_admin)):
    return get_enrolled_students(course_id)
