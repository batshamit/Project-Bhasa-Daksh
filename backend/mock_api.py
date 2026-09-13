import time
import streamlit as st

def saaras_speech_to_text(audio_bytes):
    """Mocks Speech to Text API."""
    time.sleep(1)
    return "यह एक उदाहरण हिंदी वाक्य है जिसे सिस्टम द्वारा पहचाना गया है।"

def mayura_translate(text, source_lang='en', target_lang='hi'):
    """Mocks Translation API."""
    time.sleep(1.5)
    return f"[Hindi Translation]\n\n{text[:100]}... (Translation simulated by Mayura API)"

def bulbul_text_to_speech(text, lang='hi'):
    """Mocks Text to Speech API."""
    time.sleep(1)
    return "placeholder_audio.wav"

def sarvam_105b_evaluate(question, answer, phase):
    """Mocks Evaluation API."""
    time.sleep(1.5)
    
    # Simple mocked evaluation logic based on length
    if len(answer) > 50:
        return {
            "score": 4,
            "feedback": "Great response with good detail.",
            "suggestions": "Try to provide even more specific examples."
        }
    elif len(answer) > 20:
        return {
            "score": 3,
            "feedback": "Good response, but could be more detailed.",
            "suggestions": "Elaborate more on the core concepts."
        }
    else:
        return {
            "score": 2,
            "feedback": "The response is quite brief.",
            "suggestions": "Please provide a more comprehensive answer."
        }

def sarvam_105b_generate_mcqs(lecture_text, num_questions=5):
    """Mocks MCQ Generation API."""
    time.sleep(2)
    
    questions = []
    # Extract some words from the lecture to make questions feel contextual
    words = lecture_text.split()
    
    templates = [
        ("What is the main topic discussed in this lecture?",
         "The concepts and principles covered in this module",
         "Advanced quantum physics", "Medieval European history", "Organic chemistry reactions"),
        ("Which of the following best describes a key concept from this lecture?",
         "A fundamental principle explained in the course material",
         "An unrelated mathematical theorem", "A cooking technique", "A musical composition method"),
        ("What is an important takeaway from this module?",
         "Understanding and applying the core concepts discussed",
         "Memorizing random dates", "Learning a new language alphabet", "Practicing calligraphy"),
        ("Why is the subject matter of this lecture important?",
         "It provides practical knowledge applicable to real-world scenarios",
         "It is only useful for passing exams", "It has no practical application", "It is purely theoretical"),
        ("How can the concepts from this lecture be applied in practice?",
         "By implementing the strategies and frameworks discussed",
         "By ignoring all the principles taught", "By focusing only on memorization", "By avoiding any practical application"),
    ]
    
    for i in range(min(num_questions, len(templates))):
        q_text, correct_opt, wrong_b, wrong_c, wrong_d = templates[i]
        q = {
            "question": q_text,
            "option_a": correct_opt,
            "option_b": wrong_b,
            "option_c": wrong_c,
            "option_d": wrong_d,
            "correct": correct_opt,
            "explanation": f"This is the correct answer because it directly relates to the lecture content."
        }
        questions.append(q)
        
    return questions
