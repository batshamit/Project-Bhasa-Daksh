import io
import json
from pypdf import PdfReader

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from an uploaded PDF file."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_pages = [page.extract_text() for page in reader.pages if page.extract_text()]
        full_text = "\n\n".join(text_pages)
        return full_text.strip() if full_text else "No text could be extracted from PDF."
    except Exception as e:
        print("Error reading PDF:", e)
        return "Failed to parse PDF document."

def generate_pls_content(title: str, english_text: str):
    """
    Generates bilingual content, notes, 4 PLS Phase levels, and bilingual MCQs.
    """
    lines = [line.strip() for line in english_text.split('.') if len(line.strip()) > 15]
    summary_bullets = lines[:8] if lines else [english_text[:100]]

    # 1. English Notes
    notes_en = "\n".join(f"• {b}." for b in summary_bullets)

    # 2. Hindi Translation (Simulated Mayura Translation)
    hindi_paragraphs = []
    for para in english_text.split('\n\n'):
        if para.strip():
            hindi_paragraphs.append(f"{para.strip()} (अनुवादित सामग्री)")
    hindi_content = "\n\n".join(hindi_paragraphs) if hindi_paragraphs else f"{english_text} (हिंदी अनुवाद)"

    # 3. Hindi Notes
    notes_hi = "\n".join(f"• {b} (मुख्य बिंदु)." for b in summary_bullets)

    # 4. PLS Phase Notes Generation
    phase_1_bullets = []
    phase_2_bullets = []
    phase_3_bullets = []
    phase_4_bullets = []

    for b in summary_bullets:
        words = b.split()
        kw1 = words[0] if len(words) > 0 else "Concept"
        kw2 = words[1] if len(words) > 1 else "Process"

        # Phase 1: 100% Hindi + English keywords in brackets
        phase_1_bullets.append(f"• {b} (मुख्य अवधारणा: {kw1} / {kw2}).")
        # Phase 2: Hinglish
        phase_2_bullets.append(f"• {kw1} {kw2} concept is essential for business operations aur market growth ke liye.")
        # Phase 3: English + Hindi Glosses
        phase_3_bullets.append(f"• {b} (महत्वपूर्ण सिद्धांत: {kw1}).")
        # Phase 4: Full English
        phase_4_bullets.append(f"• {b}.")

    phase_notes = {
        "1": "\n".join(phase_1_bullets),
        "2": "\n".join(phase_2_bullets),
        "3": "\n".join(phase_3_bullets),
        "4": "\n".join(phase_4_bullets)
    }

    # 5. Generate 5 Bilingual MCQs
    mcqs = []
    topic = title or "Lecture Concept"
    
    mcq_templates = [
        {
            "question": f"What is the primary focus of {topic}?",
            "question_hi": f"{topic} का मुख्य ध्यान क्या है?",
            "option_a": f"Understanding {summary_bullets[0][:40]}...",
            "option_a_hi": f"{summary_bullets[0][:40]} को समझना...",
            "option_b": "Ignoring operational metrics",
            "option_b_hi": "संचालन मेट्रिक्स की उपेक्षा करना",
            "option_c": "Manual paper tracking",
            "option_c_hi": "मैनुअल कागजी ट्रैकिंग",
            "option_d": "None of the above",
            "option_d_hi": "उपरोक्त में से कोई नहीं",
            "correct": "a",
            "explanation": f"The lecture highlights that {topic} focuses on core process optimization.",
            "explanation_hi": f"व्याख्यान यह उजागर करता है कि {topic} मुख्य प्रक्रिया के अनुकूलन पर केंद्रित है।"
        },
        {
            "question": "Which phase of skilling transitions content to Hinglish?",
            "question_hi": "स्किलिंग का कौन सा चरण सामग्री को हिंग्लिश में स्थानांतरित करता है?",
            "option_a": "Phase 1",
            "option_a_hi": "चरण 1",
            "option_b": "Phase 2",
            "option_b_hi": "चरण 2",
            "option_c": "Phase 3",
            "option_c_hi": "चरण 3",
            "option_d": "Phase 4",
            "option_d_hi": "चरण 4",
            "correct": "b",
            "explanation": "Phase 2 introduces Hinglish sentences to build vocabulary confidence.",
            "explanation_hi": "चरण 2 शब्दावली का आत्मविश्वास बनाने के लिए हिंग्लिश वाक्यों की शुरुआत करता है।"
        },
        {
            "question": "Why is progressive language learning effective?",
            "question_hi": "प्रगतिशील भाषा शिक्षा क्यों प्रभावी है?",
            "option_a": "It gradually builds English vocabulary through 4 structured phases",
            "option_a_hi": "यह 4 संरचित चरणों के माध्यम से धीरे-धीरे अंग्रेजी शब्दावली बनाता है",
            "option_b": "It forces immediate 100% English memorization",
            "option_b_hi": "यह तत्काल 100% अंग्रेजी याद करने के लिए मजबूर करता है",
            "option_c": "It eliminates evaluation tests",
            "option_c_hi": "यह मूल्यांकन परीक्षाओं को समाप्त करता है",
            "option_d": "It requires physical textbooks",
            "option_d_hi": "इसके लिए भौतिक पाठ्यपुस्तकों की आवश्यकता होती है",
            "correct": "a",
            "explanation": "PLS helps learners transition smoothly from Hindi to professional English.",
            "explanation_hi": "PLS शिक्षार्थियों को हिंदी से पेशेवर अंग्रेजी में सुचारू रूप से स्थानांतरित करने में मदद करता है।"
        },
        {
            "question": "What is the final stage (Phase 4) in Progressive Language Skilling?",
            "question_hi": "प्रगतिशील भाषा कौशल में अंतिम चरण (चरण 4) क्या है?",
            "option_a": "100% Hindi",
            "option_a_hi": "100% हिंदी",
            "option_b": "Hinglish Mix",
            "option_b_hi": "हिंग्लिश मिश्रण",
            "option_c": "100% Professional English",
            "option_c_hi": "100% पेशेवर अंग्रेजी",
            "option_d": "No language",
            "option_d_hi": "कोई भाषा नहीं",
            "correct": "c",
            "explanation": "Phase 4 represents full mastery of professional English.",
            "explanation_hi": "चरण 4 पेशेवर अंग्रेजी की पूर्ण महारत का प्रतिनिधित्व करता है।"
        },
        {
            "question": "How are evaluation tests graded across languages?",
            "question_hi": "विभिन्न भाषाओं में मूल्यांकन परीक्षाओं का ग्रेड कैसे दिया जाता है?",
            "option_a": "Equally across all learners, regardless of English or Hindi version",
            "option_a_hi": "अंग्रेजी या हिंदी संस्करण की परवाह किए बिना सभी शिक्षार्थियों में समान रूप से",
            "option_b": "Hindi learners receive lower scores",
            "option_b_hi": "हिंदी शिक्षार्थियों को कम अंक मिलते हैं",
            "option_c": "English learners get bonus points",
            "option_c_hi": "अंग्रेजी शिक्षार्थियों को बोनस अंक मिलते हैं",
            "option_d": "Separate uncompared leaderboards",
            "option_d_hi": "अलग-अलग अतुलनीय लीडरबोर्ड",
            "correct": "a",
            "explanation": "Evaluations compare performance anonymously across all learners regardless of language.",
            "explanation_hi": "मूल्यांकन भाषा की परवाह किए बिना सभी शिक्षार्थियों में गुमनाम रूप से प्रदर्शन की तुलना करता है।"
        }
    ]

    return {
        "hindi_content": hindi_content,
        "notes_en": notes_en,
        "notes_hi": notes_hi,
        "phase_notes": phase_notes,
        "mcqs": mcq_templates
    }
