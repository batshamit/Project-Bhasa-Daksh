import streamlit as st
from database import init_database, seed_default_data
from state_manager import (
    init_session_state, login, logout, register_student,
    is_logged_in, get_role, get_username
)

st.set_page_config(
    page_title='Bhasha-Daksh | AI Skilling Platform',
    page_icon='🎓',
    layout='wide'
)

init_database()
seed_default_data()
init_session_state()

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Global text and font */
html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}
.stApp {
    background-color: #0E1117;
}

/* Force ALL text to be bright and readable */
.stApp, .stApp p, .stApp span, .stApp li, .stApp div,
.stApp [data-testid="stMarkdownContainer"],
.stApp [data-testid="stMarkdownContainer"] p,
.stApp [data-testid="stMarkdownContainer"] li,
.stApp [data-testid="stMarkdownContainer"] span,
.stApp [data-testid="stExpander"] p,
.stApp [data-testid="stExpander"] li,
.stApp [data-testid="stExpander"] span {
    color: #F0F0F0 !important;
    line-height: 1.7 !important;
}

/* Headings stand out */
.stApp h1, .stApp h2, .stApp h3, .stApp h4 {
    color: #FFFFFF !important;
    font-weight: 700 !important;
}

/* Bold text is brighter */
.stApp strong, .stApp b {
    color: #FFFFFF !important;
    font-weight: 600 !important;
}

/* Lecture content paragraphs — clear spacing */
.stApp [data-testid="stMarkdownContainer"] p {
    margin-bottom: 1rem !important;
    font-size: 0.95rem !important;
}

/* Bullet points / lists — proper indentation and spacing */
.stApp [data-testid="stMarkdownContainer"] ul,
.stApp [data-testid="stMarkdownContainer"] ol {
    padding-left: 1.5rem !important;
    margin-bottom: 0.8rem !important;
}
.stApp [data-testid="stMarkdownContainer"] li {
    margin-bottom: 0.5rem !important;
    padding-left: 0.3rem !important;
    font-size: 0.93rem !important;
}

/* Expanders — clean background, NO overlay effect */
div[data-testid="stExpander"] {
    background-color: #161B22 !important;
    border: 1px solid #30363D !important;
    border-radius: 8px !important;
}
div[data-testid="stExpander"] summary {
    color: #E6E6E6 !important;
    font-weight: 600 !important;
}
div[data-testid="stExpander"] [data-testid="stMarkdownContainer"] {
    padding: 0.5rem 0 !important;
}

/* Containers with border */
.stApp div[data-testid="stVerticalBlockBorderWrapper"] {
    background-color: #161B22 !important;
    border: 1px solid #30363D !important;
    border-radius: 8px !important;
}

/* Buttons */
div.stButton > button {
    background: linear-gradient(135deg, #6C63FF, #483dff);
    color: white !important;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
}
div.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
    color: white !important;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] { gap: 2rem; }
.stTabs [data-baseweb="tab"] {
    height: 50px;
    background-color: transparent;
    padding-top: 10px;
    padding-bottom: 10px;
}
.stTabs [aria-selected="true"] {
    border-bottom: 2px solid #6C63FF !important;
    color: #6C63FF !important;
    font-weight: 600;
}

/* Progress bar */
.stProgress > div > div > div > div {
    background-image: linear-gradient(to right, #6C63FF, #00C853);
}

/* Text inputs — readable */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea {
    background-color: #1A1A2E !important;
    color: #F0F0F0 !important;
    border: 1px solid #30363D !important;
    border-radius: 6px;
}

/* Radio buttons text */
.stRadio label, .stRadio p, .stSelectbox label {
    color: #E6E6E6 !important;
}

</style>
""", unsafe_allow_html=True)

if not is_logged_in():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<h1 style='text-align: center;'>🎓 Bhasha-Daksh</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #aaa;'>AI-Driven Regional-to-Global Skilling Platform</p>", unsafe_allow_html=True)
        
        tab1, tab2 = st.tabs(['🔐 Login', '📝 Register'])
        
        with tab1:
            with st.container(border=True):
                username = st.text_input("Username", key="login_user")
                password = st.text_input("Password", type="password", key="login_pass")
                if st.button("Login", use_container_width=True):
                    success, msg = login(username, password)
                    if success:
                        st.success(msg)
                        st.rerun()
                    else:
                        st.error(msg)
                        
        with tab2:
            with st.container(border=True):
                full_name = st.text_input("Full Name")
                reg_user = st.text_input("Username", key="reg_user")
                reg_pass = st.text_input("Password", type="password", key="reg_pass")
                reg_pass2 = st.text_input("Confirm Password", type="password")
                if st.button("Register", use_container_width=True):
                    if not full_name or not reg_user or not reg_pass:
                        st.error("Please fill all fields.")
                    elif reg_pass != reg_pass2:
                        st.error("Passwords do not match.")
                    else:
                        success, msg = register_student(reg_user, reg_pass, full_name)
                        if success:
                            st.success("Registration successful! Please wait for admin approval.")
                            st.info("Pending accounts need admin approval before logging in.")
                        else:
                            st.error(msg)
else:
    role = get_role()
    
    with st.sidebar:
        st.title('🎓 Bhasha-Daksh')
        try:
            st.caption(f'Welcome, {st.session_state.user_name}')
        except:
            st.caption(f'Welcome, {get_username()}')
        st.caption(f'Role: {role.capitalize()}')
        st.divider()
        if st.button('🚪 Logout', use_container_width=True):
            logout()
            st.rerun()
            
    if role == 'admin':
        from admin_dashboard import render_admin_dashboard
        render_admin_dashboard()
    elif role == 'student':
        from student_dashboard import render_student_dashboard
        render_student_dashboard()
