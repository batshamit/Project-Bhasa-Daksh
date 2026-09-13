from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from models import LectureCreate
from database import get_all_lectures, get_lecture, add_lecture, save_mcqs
from pls_generator import extract_text_from_pdf, generate_pls_content
from routes.auth_routes import get_current_user, require_admin

router = APIRouter()

@router.get('/')
def get_lectures(user=Depends(get_current_user)):
    return get_all_lectures()

@router.get('/{module_id}')
def get_lecture_by_id(module_id: str, user=Depends(get_current_user)):
    lecture = get_lecture(module_id)
    if not lecture:
        raise HTTPException(status_code=404, detail='Lecture not found')
    return lecture

@router.post('/')
def add_new_lecture(lecture: LectureCreate, user=Depends(require_admin)):
    pls_data = generate_pls_content(lecture.title, lecture.english)
    
    add_lecture(
        module_id=lecture.module_id,
        title=lecture.title,
        english=lecture.english,
        hindi=pls_data['hindi_content'],
        notes_en=pls_data['notes_en'],
        notes_hi=pls_data['notes_hi'],
        phase_notes_dict=pls_data['phase_notes'],
        course_id=lecture.course_id
    )
    
    save_mcqs(lecture.module_id, pls_data['mcqs'])
    
    return {'message': 'Lecture, bilingual translation, PLS phases, and MCQs generated successfully'}

@router.post('/upload-pdf')
async def upload_pdf_lecture(
    module_id: str = Form(...),
    title: str = Form(...),
    course_id: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(require_admin)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail='Only PDF files are supported')
        
    contents = await file.read()
    extracted_text = extract_text_from_pdf(contents)
    
    if not extracted_text or len(extracted_text) < 10:
        raise HTTPException(status_code=400, detail='Could not extract readable text from uploaded PDF')
        
    pls_data = generate_pls_content(title, extracted_text)
    
    add_lecture(
        module_id=module_id,
        title=title,
        english=extracted_text,
        hindi=pls_data['hindi_content'],
        notes_en=pls_data['notes_en'],
        notes_hi=pls_data['notes_hi'],
        phase_notes_dict=pls_data['phase_notes'],
        course_id=course_id
    )
    
    save_mcqs(module_id, pls_data['mcqs'])
    
    return {
        'message': f'PDF "{file.filename}" uploaded & converted into English, Hindi, PLS Phases 1-4, and MCQs!',
        'module_id': module_id,
        'extracted_length': len(extracted_text)
    }
