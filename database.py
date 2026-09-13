import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bhasha_daksh.db')

def get_connection():
    """Returns a sqlite3.Connection with row_factory = sqlite3.Row"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Creates all tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        status TEXT NOT NULL DEFAULT 'pending'
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        course_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS enrollments (
        username TEXT,
        course_id TEXT,
        enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (username, course_id),
        FOREIGN KEY (username) REFERENCES users(username),
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lectures (
        module_id TEXT PRIMARY KEY,
        course_id TEXT,
        title TEXT NOT NULL,
        english TEXT,
        hindi TEXT,
        notes_en TEXT,
        notes_hi TEXT,
        phase_notes TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id TEXT,
        question TEXT,
        option_a TEXT,
        option_b TEXT,
        option_c TEXT,
        option_d TEXT,
        correct TEXT,
        explanation TEXT,
        question_hi TEXT,
        option_a_hi TEXT,
        option_b_hi TEXT,
        option_c_hi TEXT,
        option_d_hi TEXT,
        explanation_hi TEXT,
        FOREIGN KEY (module_id) REFERENCES lectures(module_id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS progress (
        username TEXT,
        module_id TEXT,
        completed INTEGER DEFAULT 0,
        PRIMARY KEY (username, module_id),
        FOREIGN KEY (username) REFERENCES users(username),
        FOREIGN KEY (module_id) REFERENCES lectures(module_id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        module_id TEXT,
        score INTEGER,
        total INTEGER,
        pls_phase INTEGER DEFAULT 1,
        attempt INTEGER DEFAULT 1,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username),
        FOREIGN KEY (module_id) REFERENCES lectures(module_id)
    );
    ''')
    
    conn.commit()
    conn.close()

def seed_default_data():
    """Seeds default data into the database."""
    from content import MODULES, EVALUATION_QUESTIONS, EVALUATION_QUESTIONS_HI, PLS_PHASE_CONFIG, COURSES
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Seed users
    users = [
        ('admin', 'admin123', 'Administrator', 'admin', 'approved'),
        ('student1', 'pass123', 'Rahul Kumar', 'student', 'approved'),
        ('student2', 'pass123', 'Priya Sharma', 'student', 'approved'),
        ('student3', 'pass123', 'Amit Patel', 'student', 'approved')
    ]
    for u in users:
        cursor.execute("INSERT OR IGNORE INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)", u)
        
    # Seed courses
    for course_id, cdata in COURSES.items():
        cursor.execute("INSERT OR IGNORE INTO courses (course_id, title, description) VALUES (?, ?, ?)",
                       (course_id, cdata['title'], cdata['description']))

    # Seed enrollments
    enrollments = [
        ('student1', 'course_1'),
        ('student1', 'course_2'),
        ('student2', 'course_1'),
        ('student3', 'course_2'),
    ]
    for e in enrollments:
        cursor.execute("INSERT OR IGNORE INTO enrollments (username, course_id) VALUES (?, ?)", e)

    # Seed lectures
    for module_id, data in MODULES.items():
        # Convert list notes to strings if needed
        notes_en = data.get('notes_en', '')
        notes_hi = data.get('notes_hi', '')
        if isinstance(notes_en, list):
            notes_en = '\n'.join('• ' + item for item in notes_en)
        if isinstance(notes_hi, list):
            notes_hi = '\n'.join('• ' + item for item in notes_hi)
        
        # Convert phase_notes: int keys -> str keys, list values -> str values
        raw_phase_notes = data.get('phase_notes', {})
        phase_notes_clean = {}
        for k, v in raw_phase_notes.items():
            if isinstance(v, list):
                phase_notes_clean[str(k)] = '\n'.join('• ' + item for item in v)
            else:
                phase_notes_clean[str(k)] = str(v)
        phase_notes = json.dumps(phase_notes_clean)
        
        # Determine course_id for this module
        course_id_for_module = None
        for cid, cdata in COURSES.items():
            if module_id in cdata.get('modules', []):
                course_id_for_module = cid
                break

        cursor.execute('''
            INSERT OR IGNORE INTO lectures (module_id, course_id, title, english, hindi, notes_en, notes_hi, phase_notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (module_id, course_id_for_module, data.get('title'), data.get('english'), data.get('hindi'), notes_en, notes_hi, phase_notes))
        
    # Seed evaluations
    for module_id, questions in EVALUATION_QUESTIONS.items():
        hi_questions = EVALUATION_QUESTIONS_HI.get(module_id, [])
        for idx, q in enumerate(questions):
            hi_q = hi_questions[idx] if idx < len(hi_questions) else {}
            # Check if this exact question for this module already exists to avoid duplicates if re-run
            cursor.execute("SELECT id FROM evaluations WHERE module_id=? AND question=?", (module_id, q['question']))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO evaluations (module_id, question, option_a, option_b, option_c, option_d, correct, explanation,
                                             question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (module_id, q['question'], q['option_a'], q['option_b'], q['option_c'], q['option_d'], q['correct'], q['explanation'],
                      hi_q.get('question_hi', ''), hi_q.get('option_a_hi', ''), hi_q.get('option_b_hi', ''), hi_q.get('option_c_hi', ''), hi_q.get('option_d_hi', ''), hi_q.get('explanation_hi', '')))
            
    conn.commit()
    conn.close()

def add_user(username, password, name, role='student', status='pending'):
    """Adds a new user. Returns True if added, False if username exists."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)", 
                       (username, password, name, role, status))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user(username):
    """Retrieves user info."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password, name, role, status FROM users WHERE username=?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_pending_users():
    """Retrieves all pending users."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password, name, role, status FROM users WHERE status='pending'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def approve_user(username):
    """Approves a pending user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET status='approved' WHERE username=?", (username,))
    conn.commit()
    conn.close()

def reject_user(username):
    """Rejects (deletes) a pending user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE username=?", (username,))
    conn.commit()
    conn.close()

def get_all_students():
    """Retrieves all approved students."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password, name, role, status FROM users WHERE role='student' AND status='approved'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_course(course_id, title, description):
    """Adds a new course."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO courses (course_id, title, description) VALUES (?, ?, ?)",
                       (course_id, title, description))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_all_courses():
    """Retrieves all courses."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_course(course_id):
    """Retrieves a specific course."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses WHERE course_id=?", (course_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_modules_for_course(course_id):
    """Retrieves all modules/lectures belonging to a course."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lectures WHERE course_id=?", (course_id,))
    rows = cursor.fetchall()
    conn.close()
    lectures = []
    for r in rows:
        d = dict(r)
        d['phase_notes'] = json.loads(d['phase_notes']) if d['phase_notes'] else {}
        lectures.append(d)
    return lectures

def enroll_student(username, course_id):
    """Enrolls a student in a course."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT OR IGNORE INTO enrollments (username, course_id) VALUES (?, ?)",
                       (username, course_id))
        conn.commit()
    finally:
        conn.close()

def unenroll_student(username, course_id):
    """Removes a student from a course."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM enrollments WHERE username=? AND course_id=?", (username, course_id))
    conn.commit()
    conn.close()

def get_enrolled_courses(username):
    """Gets all courses a student is enrolled in."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.* FROM courses c
        JOIN enrollments e ON c.course_id = e.course_id
        WHERE e.username = ?
    ''', (username,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def is_enrolled(username, course_id):
    """Checks if a student is enrolled in a course."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM enrollments WHERE username=? AND course_id=?", (username, course_id))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def get_enrolled_students(course_id):
    """Gets all students enrolled in a specific course."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.username, u.name FROM users u
        JOIN enrollments e ON u.username = e.username
        WHERE e.course_id = ? AND u.status = 'approved' AND u.role = 'student'
    ''', (course_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_lecture(module_id, title, english, hindi, notes_en, notes_hi, phase_notes_dict, course_id=None):
    """Adds a new lecture."""
    conn = get_connection()
    cursor = conn.cursor()
    phase_notes_json = json.dumps(phase_notes_dict)
    cursor.execute('''
        INSERT OR REPLACE INTO lectures (module_id, course_id, title, english, hindi, notes_en, notes_hi, phase_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (module_id, course_id, title, english, hindi, notes_en, notes_hi, phase_notes_json))
    conn.commit()
    conn.close()

def get_all_lectures():
    """Retrieves all lectures."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lectures")
    rows = cursor.fetchall()
    conn.close()
    
    lectures = []
    for r in rows:
        d = dict(r)
        d['phase_notes'] = json.loads(d['phase_notes']) if d['phase_notes'] else {}
        lectures.append(d)
    return lectures

def get_lecture(module_id):
    """Retrieves a specific lecture."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lectures WHERE module_id=?", (module_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['phase_notes'] = json.loads(d['phase_notes']) if d['phase_notes'] else {}
        return d
    return None

def save_mcqs(module_id, questions_list):
    """Replaces MCQs for a module."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM evaluations WHERE module_id=?", (module_id,))
    for q in questions_list:
        cursor.execute('''
            INSERT INTO evaluations (module_id, question, option_a, option_b, option_c, option_d, correct, explanation,
                                     question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (module_id, q.get('question',''), q.get('option_a',''), q.get('option_b',''), q.get('option_c',''), q.get('option_d',''),
              q.get('correct',''), q.get('explanation',''),
              q.get('question_hi',''), q.get('option_a_hi',''), q.get('option_b_hi',''), q.get('option_c_hi',''), q.get('option_d_hi',''), q.get('explanation_hi','')))
    conn.commit()
    conn.close()

def get_mcqs(module_id):
    """Retrieves MCQs for a module."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evaluations WHERE module_id=?", (module_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_mcq(mcq_id, question, option_a, option_b, option_c, option_d, correct, explanation,
               question_hi='', option_a_hi='', option_b_hi='', option_c_hi='', option_d_hi='', explanation_hi=''):
    """Updates a specific MCQ."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE evaluations SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct=?, explanation=?,
               question_hi=?, option_a_hi=?, option_b_hi=?, option_c_hi=?, option_d_hi=?, explanation_hi=?
        WHERE id=?
    ''', (question, option_a, option_b, option_c, option_d, correct, explanation,
          question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi, mcq_id))
    conn.commit()
    conn.close()

def delete_mcq(mcq_id):
    """Deletes an MCQ."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM evaluations WHERE id=?", (mcq_id,))
    conn.commit()
    conn.close()

def add_mcq(module_id, question, option_a, option_b, option_c, option_d, correct, explanation,
            question_hi='', option_a_hi='', option_b_hi='', option_c_hi='', option_d_hi='', explanation_hi=''):
    """Adds a single MCQ."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO evaluations (module_id, question, option_a, option_b, option_c, option_d, correct, explanation,
                                 question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (module_id, question, option_a, option_b, option_c, option_d, correct, explanation,
          question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi))
    conn.commit()
    conn.close()

def mark_module_complete(username, module_id):
    """Marks a module as complete for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO progress (username, module_id, completed) VALUES (?, ?, 1)
    ''', (username, module_id))
    conn.commit()
    conn.close()

def is_module_complete(username, module_id):
    """Checks if a module is complete."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT completed FROM progress WHERE username=? AND module_id=?", (username, module_id))
    row = cursor.fetchone()
    conn.close()
    return bool(row and row['completed'])

def get_completed_modules(username):
    """Retrieves all completed module IDs for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT module_id FROM progress WHERE username=? AND completed=1", (username,))
    rows = cursor.fetchall()
    conn.close()
    return [r['module_id'] for r in rows]

def save_score(username, module_id, score, total, pls_phase):
    """Saves a student score."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(attempt) as max_attempt FROM scores WHERE username=? AND module_id=?", (username, module_id))
    row = cursor.fetchone()
    attempt = 1
    if row and row['max_attempt']:
        attempt = row['max_attempt'] + 1
        
    cursor.execute('''
        INSERT INTO scores (username, module_id, score, total, pls_phase, attempt)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (username, module_id, score, total, pls_phase, attempt))
    conn.commit()
    conn.close()

def get_student_scores(username):
    """Gets all scores for a student."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scores WHERE username=? ORDER BY module_id, attempt", (username,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_scores():
    """Gets all scores for all students."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scores")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_best_scores(username):
    """Gets best score per module for a student."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT module_id, MAX(score) as best_score, total 
        FROM scores WHERE username=? GROUP BY module_id
    ''', (username,))
    rows = cursor.fetchall()
    conn.close()
    return {r['module_id']: dict(r) for r in rows}
