import streamlit as st
from database import get_user, add_user, get_student_scores, get_all_scores, get_best_scores
from content import PLS_PHASE_CONFIG

def init_session_state():
    """Initializes basic session state variables."""
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False
    if 'username' not in st.session_state:
        st.session_state.username = ''
    if 'role' not in st.session_state:
        st.session_state.role = ''
    if 'user_name' not in st.session_state:
        st.session_state.user_name = ''
    if 'current_module' not in st.session_state:
        st.session_state.current_module = None

def login(username, password):
    """Logs in a user."""
    user = get_user(username)
    if not user:
        return False, 'Invalid username or password'
    if user['password'] != password:
        return False, 'Invalid username or password'
    if user['status'] == 'pending':
        return False, 'Your account is pending admin approval. Please wait.'
    if user['status'] == 'rejected':
        return False, 'Your registration was not approved.'
        
    st.session_state.logged_in = True
    st.session_state.username = username
    st.session_state.role = user['role']
    st.session_state.user_name = user['name']
    return True, 'Login successful'

def logout():
    """Logs out the user by resetting session state."""
    st.session_state.logged_in = False
    st.session_state.username = ''
    st.session_state.role = ''
    st.session_state.user_name = ''
    st.session_state.current_module = None

def register_student(username, password, name):
    """Registers a new student with pending status."""
    success = add_user(username, password, name, role='student', status='pending')
    if success:
        return True, 'Registration successful! Please wait for admin approval.'
    else:
        return False, 'Username already exists'

def is_logged_in():
    """Returns whether a user is logged in."""
    return st.session_state.get('logged_in', False)

def get_role():
    """Returns the current user's role."""
    return st.session_state.get('role', '')

def get_username():
    """Returns the current user's username."""
    return st.session_state.get('username', '')

def get_phase_config(phase):
    """Returns the configuration for a given PLS phase."""
    return PLS_PHASE_CONFIG.get(phase, {})
