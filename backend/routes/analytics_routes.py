from fastapi import APIRouter, HTTPException, Depends
from database import get_student_scores, get_all_scores, get_best_scores, get_all_students, get_completed_modules
from routes.auth_routes import get_current_user, require_admin
import string

router = APIRouter()

@router.get('/scores/{username}')
def student_scores(username: str, user=Depends(get_current_user)):
    return get_student_scores(username)

@router.get('/scores')
def all_scores(user=Depends(require_admin)):
    return get_all_scores()

@router.get('/best/{username}')
def best_scores(username: str, user=Depends(get_current_user)):
    raw_scores = get_best_scores(username)
    result = []
    for mod_id, s in raw_scores.items():
        score_val = s.get('best_score', 0)
        total_val = s.get('total', 5)
        pct = round((score_val / total_val * 100)) if total_val > 0 else 0
        pls = s.get('pls_phase', 1)
        result.append({
            'module_id': mod_id,
            'score': score_val,
            'total': total_val,
            'total_questions': total_val,
            'percentage': pct,
            'phase': f'Phase {pls}',
            'pls_phase': pls,
            'evaluated_at': s.get('timestamp', '')
        })
    return result

@router.get('/leaderboard')
def leaderboard(user=Depends(get_current_user)):
    students = [s for s in get_all_students() if s['status'] == 'approved']
    leaderboard_data = []
    
    for student in students:
        uname = student['username']
        raw_best = get_best_scores(uname)
        completed = get_completed_modules(uname)
        
        if raw_best:
            best_list = list(raw_best.values())
            total_pct = sum((s.get('best_score', 0) / s.get('total', 5) * 100) if s.get('total', 0) > 0 else 0 for s in best_list)
            avg_score = round(total_pct / len(best_list), 1)
            best_phase = max((s.get('pls_phase', 1) for s in best_list), default=1)
        else:
            avg_score = 0
            best_phase = 1
            
        leaderboard_data.append({
            'username': uname,
            'name': student.get('name', uname),
            'avgScore': avg_score,
            'modulesCompleted': len(completed),
            'bestPhase': f'Phase {best_phase}'
        })
        
    leaderboard_data.sort(key=lambda x: (x['avgScore'], x['modulesCompleted']), reverse=True)
    
    letters = list(string.ascii_uppercase)
    for idx, entry in enumerate(leaderboard_data):
        entry['rank'] = idx + 1
        letter = letters[idx % len(letters)]
        entry['displayName'] = 'You ⭐' if entry['username'] == user['username'] else f'Learner {letter}'
        
    return leaderboard_data

@router.get('/admin-leaderboard')
def admin_leaderboard(user=Depends(require_admin)):
    students = [s for s in get_all_students() if s['status'] == 'approved']
    leaderboard_data = []
    
    for student in students:
        uname = student['username']
        raw_best = get_best_scores(uname)
        completed = get_completed_modules(uname)
        
        if raw_best:
            best_list = list(raw_best.values())
            total_pct = sum((s.get('best_score', 0) / s.get('total', 5) * 100) if s.get('total', 0) > 0 else 0 for s in best_list)
            avg_score = round(total_pct / len(best_list), 1)
            best_phase = max((s.get('pls_phase', 1) for s in best_list), default=1)
        else:
            avg_score = 0
            best_phase = 1
            
        leaderboard_data.append({
            'username': uname,
            'name': student.get('name', uname),
            'avgScore': avg_score,
            'modulesCompleted': len(completed),
            'bestPhase': f'Phase {best_phase}'
        })
        
    leaderboard_data.sort(key=lambda x: (x['avgScore'], x['modulesCompleted']), reverse=True)
    
    for idx, entry in enumerate(leaderboard_data):
        entry['rank'] = idx + 1
        
    return leaderboard_data
