from fastapi import APIRouter, HTTPException, Depends
from models import SubmitEvaluation, MCQUpdate, MCQCreate
from database import get_mcqs, save_score, update_mcq, delete_mcq, add_mcq, mark_module_complete
from routes.auth_routes import get_current_user, require_admin

router = APIRouter()

@router.get('/{module_id}')
def get_module_mcqs(module_id: str, user=Depends(get_current_user)):
    return get_mcqs(module_id)

def get_correct_letter(q):
    raw = str(q.get('correct', '')).strip()
    raw_lower = raw.lower()
    if raw_lower in ['a', 'b', 'c', 'd']:
        return raw_lower
    if raw_lower.startswith('option_') and len(raw_lower) == 8:
        return raw_lower[-1]
    for letter in ['a', 'b', 'c', 'd']:
        opt_en = str(q.get(f'option_{letter}', '')).strip()
        opt_hi = str(q.get(f'option_{letter}_hi', '')).strip()
        if raw and (raw == opt_en or raw == opt_hi or raw_lower == opt_en.lower() or raw_lower == opt_hi.lower()):
            return letter
    return 'a'

def get_user_letter(ans_raw, q):
    ans_str = str(ans_raw or '').strip()
    ans_lower = ans_str.lower()
    if ans_lower in ['a', 'b', 'c', 'd']:
        return ans_lower
    if ans_lower.startswith('option_') and len(ans_lower) == 8:
        return ans_lower[-1]
    for letter in ['a', 'b', 'c', 'd']:
        opt_en = str(q.get(f'option_{letter}', '')).strip()
        opt_hi = str(q.get(f'option_{letter}_hi', '')).strip()
        if ans_str and (ans_str == opt_en or ans_str == opt_hi or ans_lower == opt_en.lower() or ans_lower == opt_hi.lower()):
            return letter
    return ans_lower

@router.post('/{module_id}/submit')
def submit_eval(module_id: str, req: SubmitEvaluation, user=Depends(get_current_user)):
    mcqs = get_mcqs(module_id)
    if not mcqs:
        raise HTTPException(status_code=404, detail='No MCQs found for this module')

    score = 0
    breakdown = []
    
    user_answers = req.answers or {}
    is_hi = str(req.language).lower() in ['hindi', 'hi']
    
    for idx, q in enumerate(mcqs):
        q_id = q['id']
        correct_letter = get_correct_letter(q)
        
        if isinstance(user_answers, dict):
            raw_ans = user_answers.get(str(q_id), user_answers.get(q_id, ''))
        elif isinstance(user_answers, list) and idx < len(user_answers):
            raw_ans = user_answers[idx]
        else:
            raw_ans = ''
            
        submitted_letter = get_user_letter(raw_ans, q)
        is_correct = (submitted_letter == correct_letter)
        if is_correct:
            score += 1

        correct_text = q.get(f'option_{correct_letter}_hi') if is_hi else q.get(f'option_{correct_letter}')
        your_text = q.get(f'option_{submitted_letter}_hi') if is_hi else q.get(f'option_{submitted_letter}')

        breakdown.append({
            'questionId': q_id,
            'question': q['question_hi'] if is_hi else q['question'],
            'yourAnswer': submitted_letter,
            'yourAnswerText': your_text or submitted_letter,
            'correctAnswer': correct_letter,
            'correctAnswerText': correct_text or correct_letter,
            'correct': is_correct,
            'explanation': q['explanation_hi'] if is_hi else q['explanation']
        })

    total = len(mcqs)
    percentage = round((score / total) * 100) if total > 0 else 0

    # Determine progressive PLS Phase based on module sequence position and user preference
    from database import get_connection, get_modules_for_course
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT course_id FROM lectures WHERE module_id=?", (module_id,))
    row = cursor.fetchone()
    conn.close()

    course_id = row['course_id'] if row else None
    module_index = 0
    if course_id:
        course_mods = get_modules_for_course(course_id)
        mod_ids = [m['module_id'] for m in course_mods]
        if module_id in mod_ids:
            module_index = mod_ids.index(module_id)

    pref_lang = str(user.get('preferred_language', 'English')).lower()
    if pref_lang in ['english', 'en']:
        pls_phase = 4
    else:
        # Module 1 -> Phase 1 (Hindi), Module 2 -> Phase 2 (Hinglish), Module 3 -> Phase 3 (Bilingual), Module 4+ -> Phase 4 (English)
        pls_phase = min(4, module_index + 1)

    save_score(user['username'], module_id, score, total, pls_phase)
    
    passed = percentage >= 50
    if passed:
        mark_module_complete(user['username'], module_id)

    return {
        'score': score,
        'total': total,
        'percentage': percentage,
        'phase': f'Phase {pls_phase}',
        'pls_phase': pls_phase,
        'passed': passed,
        'breakdown': breakdown
    }

@router.get('/final/{course_id}')
def get_final_course_exam(course_id: str, user=Depends(get_current_user)):
    from database import get_modules_for_course, get_course
    course = get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    
    modules = get_modules_for_course(course_id)
    all_questions = []
    for mod in modules:
        mod_mcqs = get_mcqs(mod['module_id'])
        for q in mod_mcqs:
            q_copy = dict(q)
            q_copy['module_title'] = mod['title']
            all_questions.append(q_copy)

    return {
        'course_id': course_id,
        'course_title': course['title'],
        'questions': all_questions
    }

@router.post('/final/{course_id}/submit')
def submit_final_course_exam(course_id: str, req: SubmitEvaluation, user=Depends(get_current_user)):
    from database import get_modules_for_course
    modules = get_modules_for_course(course_id)
    all_mcqs = []
    for mod in modules:
        all_mcqs.extend(get_mcqs(mod['module_id']))

    if not all_mcqs:
        raise HTTPException(status_code=404, detail='No questions found for this course exam')

    score = 0
    breakdown = []
    user_answers = req.answers or {}

    for idx, q in enumerate(all_mcqs):
        q_id = q['id']
        correct_letter = get_correct_letter(q)
        raw_ans = user_answers.get(str(q_id), user_answers.get(q_id, ''))
        submitted_letter = get_user_letter(raw_ans, q)
        is_correct = (submitted_letter == correct_letter)
        if is_correct:
            score += 1

        correct_text = q.get(f'option_{correct_letter}')
        your_text = q.get(f'option_{submitted_letter}')

        breakdown.append({
            'questionId': q_id,
            'question': q['question'],
            'yourAnswer': submitted_letter,
            'yourAnswerText': your_text or submitted_letter,
            'correctAnswer': correct_letter,
            'correctAnswerText': correct_text or correct_letter,
            'correct': is_correct,
            'explanation': q['explanation']
        })

    total = len(all_mcqs)
    percentage = round((score / total) * 100) if total > 0 else 0
    passed = percentage >= 50

    final_mod_id = f"final_{course_id}"
    save_score(user['username'], final_mod_id, score, total, 4)
    if passed:
        mark_module_complete(user['username'], final_mod_id)

    return {
        'score': score,
        'total': total,
        'percentage': percentage,
        'phase': 'Phase 4 (Full English Course Mastery)',
        'pls_phase': 4,
        'passed': passed,
        'is_final_exam': True,
        'breakdown': breakdown
    }

@router.put('/mcq/{id}')
def update_existing_mcq(id: int, req: MCQUpdate, user=Depends(require_admin)):
    success = update_mcq(id, req.dict())
    if not success:
        raise HTTPException(status_code=404, detail='MCQ not found')
    return {'message': 'MCQ updated'}

@router.delete('/mcq/{id}')
def delete_existing_mcq(id: int, user=Depends(require_admin)):
    success = delete_mcq(id)
    if not success:
        raise HTTPException(status_code=404, detail='MCQ not found')
    return {'message': 'MCQ deleted'}

@router.post('/mcq')
def add_new_mcq(req: MCQCreate, user=Depends(require_admin)):
    success = add_mcq(req.dict())
    if not success:
        raise HTTPException(status_code=500, detail='Failed to add MCQ')
    return {'message': 'MCQ added'}
