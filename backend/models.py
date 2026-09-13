from pydantic import BaseModel
from typing import Optional, List

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    preferred_language: Optional[str] = 'Hindi'

class CourseCreate(BaseModel):
    course_id: str
    title: str
    description: str = ''

class LectureCreate(BaseModel):
    module_id: str
    title: str
    english: str
    course_id: str

class MCQCreate(BaseModel):
    module_id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str
    explanation: str = ''
    question_hi: str = ''
    option_a_hi: str = ''
    option_b_hi: str = ''
    option_c_hi: str = ''
    option_d_hi: str = ''
    explanation_hi: str = ''

class MCQUpdate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str
    explanation: str = ''
    question_hi: str = ''
    option_a_hi: str = ''
    option_b_hi: str = ''
    option_c_hi: str = ''
    option_d_hi: str = ''
    explanation_hi: str = ''

class EnrollRequest(BaseModel):
    username: str
    course_id: str

from typing import Optional, List, Dict, Any

class SubmitEvaluation(BaseModel):
    answers: Any  # dict {questionId: option} or list
    language: Optional[str] = 'English'

class MarkComplete(BaseModel):
    module_id: str

class LanguagePreferenceRequest(BaseModel):
    language: str = 'Hindi'
