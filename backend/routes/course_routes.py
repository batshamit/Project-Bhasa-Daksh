from fastapi import APIRouter, HTTPException, Depends
from models import CourseCreate, LanguagePreferenceRequest
from database import get_all_courses, get_course, add_course, get_modules_for_course, set_course_language, get_course_language
from routes.auth_routes import get_current_user, require_admin

router = APIRouter()

@router.get('/')
def get_courses(user=Depends(get_current_user)):
    return get_all_courses()

@router.get('/{course_id}')
def get_course_by_id(course_id: str, user=Depends(get_current_user)):
    course = get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    return course

@router.post('/')
def add_new_course(course: CourseCreate, user=Depends(require_admin)):
    success = add_course(course.course_id, course.title, course.description)
    if not success:
        raise HTTPException(status_code=409, detail='Course already exists')
    return {'message': 'Course added successfully'}

@router.get('/{course_id}/modules')
def get_course_modules(course_id: str, user=Depends(get_current_user)):
    return get_modules_for_course(course_id)

@router.get('/{course_id}/language')
def get_course_language_preference(course_id: str, user=Depends(get_current_user)):
    lang = get_course_language(user['username'], course_id)
    return {'language': lang}

@router.post('/{course_id}/language')
def set_course_language_preference(course_id: str, req: LanguagePreferenceRequest, user=Depends(get_current_user)):
    lang = req.language or 'Hindi'
    set_course_language(user['username'], course_id, lang)
    return {'message': 'Course learning language updated', 'language': lang}
