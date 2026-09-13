import streamlit as st
import json
import pandas as pd
from database import (
    get_all_lectures, get_lecture, add_lecture,
    get_mcqs, update_mcq, delete_mcq, add_mcq, save_mcqs,
    get_pending_users, approve_user, reject_user,
    get_all_students, get_all_scores, get_student_scores,
    get_best_scores, get_completed_modules,
    get_all_courses, get_course, add_course,
    get_modules_for_course,
    enroll_student, unenroll_student, get_enrolled_courses,
    get_enrolled_students, is_enrolled
)
from mock_api import mayura_translate, sarvam_105b_generate_mcqs
from content import PLS_PHASE_CONFIG

def render_admin_dashboard():
    st.title("👨‍💼 Admin Dashboard")
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        '📚 Courses & Lectures', '👥 User Approvals', '🎓 Enrollment',
        '✏️ Evaluation Editor', '📊 Student Tracker', '🏆 Peer Analytics'
    ])
    
    with tab1:
        st.header('Course & Lecture Management')
        
        st.subheader("📚 Existing Courses")
        courses = get_all_courses()
        if not courses:
            st.info("No courses available.")
        for course in courses:
            with st.expander(f"{course['title']} ({course['course_id']})"):
                st.write(f"**Description:** {course['description']}")
                modules = get_modules_for_course(course['course_id'])
                if modules:
                    st.write("**Modules:**")
                    for mod in modules:
                        word_count = len(mod.get('english', '').split())
                        st.write(f"- {mod['title']} ({word_count} words)")
                else:
                    st.write("No modules yet.")
                    
        st.subheader("➕ Create New Course")
        with st.expander("Create Course Form"):
            with st.form("create_course_form"):
                new_course_id = st.text_input("Course ID (e.g. 'course_3')")
                new_course_title = st.text_input("Course Title")
                new_course_desc = st.text_area("Course Description")
                if st.form_submit_button("Create Course"):
                    if new_course_id and new_course_title:
                        add_course(new_course_id, new_course_title, new_course_desc)
                        st.success(f"Course '{new_course_title}' created!")
                        st.rerun()
                    else:
                        st.error("Please provide both Course ID and Title.")
                        
        st.subheader("📤 Upload New Lecture")
        with st.expander("Upload Lecture Form"):
            with st.form("upload_lecture_form"):
                if courses:
                    course_options = {c['course_id']: c['title'] for c in courses}
                    selected_course_id = st.selectbox("Choose Course", options=list(course_options.keys()), format_func=lambda x: course_options[x])
                    mod_id = st.text_input("Module ID (e.g. 'mod_1')")
                    mod_title = st.text_input("Module Title")
                    english_content = st.text_area("English Content", height=200)
                    
                    if st.form_submit_button("Upload & Process"):
                        if selected_course_id and mod_id and mod_title and english_content:
                            with st.spinner("Processing (Translating & Generating MCQs)..."):
                                hindi_content = mayura_translate(english_content)
                                generated_mcqs = sarvam_105b_generate_mcqs(english_content, 5)
                                add_lecture(mod_id, mod_title, english_content, hindi_content, '', '', {}, selected_course_id)
                                save_mcqs(mod_id, generated_mcqs)
                                st.success("Lecture uploaded and processed successfully!")
                                st.rerun()
                        else:
                            st.error("Please fill in all fields.")
                else:
                    st.warning("Please create a course first.")

    with tab2:
        st.header('👥 User Approvals')
        pending_users = get_pending_users()
        if pending_users:
            for user in pending_users:
                col1, col2, col3 = st.columns([3, 1, 1])
                with col1:
                    st.write(f"**{user['name']}** ({user['username']}) - {user['role']}")
                with col2:
                    if st.button("✅ Approve", key=f"approve_{user['username']}"):
                        approve_user(user['username'])
                        st.success(f"Approved {user['username']}")
                        st.rerun()
                with col3:
                    if st.button("❌ Reject", key=f"reject_{user['username']}"):
                        reject_user(user['username'])
                        st.warning(f"Rejected {user['username']}")
                        st.rerun()
        else:
            st.info("No pending users.")
            
        st.subheader("📋 Approved Students")
        students = get_all_students()
        if students:
            for student in students:
                st.write(f"- {student['name']} ({student['username']})")
        else:
            st.info("No approved students yet.")

    with tab3:
        st.header('🎓 Enrollment Management')
        courses = get_all_courses()
        students = get_all_students()
        
        if not courses:
            st.warning("No courses available to manage enrollments.")
        elif not students:
            st.warning("No approved students available.")
        else:
            st.subheader("➕ Enroll Students")
            course_options = {c['course_id']: c['title'] for c in courses}
            selected_course_enroll = st.selectbox("Choose Course to Enroll", options=list(course_options.keys()), format_func=lambda x: course_options[x], key="enroll_course_select")
            
            enrolled_students_current = get_enrolled_students(selected_course_enroll)
            enrolled_usernames = [s['username'] for s in enrolled_students_current]
            
            unenrolled_students = [s for s in students if s['username'] not in enrolled_usernames]
            
            if unenrolled_students:
                unenrolled_options = {s['username']: f"{s['name']} ({s['username']})" for s in unenrolled_students}
                selected_students = st.multiselect("Select students to enroll", options=list(unenrolled_options.keys()), format_func=lambda x: unenrolled_options[x])
                
                if st.button("Enroll Selected"):
                    if selected_students:
                        for s_username in selected_students:
                            enroll_student(s_username, selected_course_enroll)
                        st.success("Students enrolled successfully!")
                        st.rerun()
                    else:
                        st.error("Please select at least one student.")
            else:
                st.info("All students are already enrolled in this course.")
                
            st.subheader("📋 Current Enrollments")
            for course in courses:
                with st.expander(f"Enrollments for: {course['title']}"):
                    enrolled = get_enrolled_students(course['course_id'])
                    if enrolled:
                        for student in enrolled:
                            col1, col2 = st.columns([4, 1])
                            with col1:
                                st.write(f"{student['name']} ({student['username']})")
                            with col2:
                                if st.button("❌ Remove", key=f"remove_{student['username']}_{course['course_id']}"):
                                    unenroll_student(student['username'], course['course_id'])
                                    st.success(f"Removed {student['name']} from {course['title']}")
                                    st.rerun()
                    else:
                        st.write("No students enrolled.")

    with tab4:
        st.header('✏️ Evaluation Editor')
        lectures = get_all_lectures()
        if not lectures:
            st.info("No lectures available.")
        else:
            mod_options = {l['module_id']: l['title'] for l in lectures}
            selected_mod_id = st.selectbox("Select Module to Edit MCQs", options=list(mod_options.keys()), format_func=lambda x: mod_options[x])
            
            if selected_mod_id:
                mcqs = get_mcqs(selected_mod_id)
                st.subheader(f"Existing MCQs for {mod_options[selected_mod_id]}")
                if mcqs:
                    for i, mcq in enumerate(mcqs):
                        with st.expander(f"Q{i+1}: {mcq.get('question', 'Question')}"):
                            with st.form(f"edit_mcq_{mcq['id']}"):
                                col1, col2 = st.columns(2)
                                with col1:
                                    st.markdown("**English**")
                                    q_en = st.text_input("Question (EN)", value=mcq.get('question', ''))
                                    opt_a_en = st.text_input("Option A (EN)", value=mcq.get('option_a', ''))
                                    opt_b_en = st.text_input("Option B (EN)", value=mcq.get('option_b', ''))
                                    opt_c_en = st.text_input("Option C (EN)", value=mcq.get('option_c', ''))
                                    opt_d_en = st.text_input("Option D (EN)", value=mcq.get('option_d', ''))
                                    exp_en = st.text_area("Explanation (EN)", value=mcq.get('explanation', ''))
                                with col2:
                                    st.markdown("**Hindi**")
                                    q_hi = st.text_input("Question (HI)", value=mcq.get('question_hi', ''))
                                    opt_a_hi = st.text_input("Option A (HI)", value=mcq.get('option_a_hi', ''))
                                    opt_b_hi = st.text_input("Option B (HI)", value=mcq.get('option_b_hi', ''))
                                    opt_c_hi = st.text_input("Option C (HI)", value=mcq.get('option_c_hi', ''))
                                    opt_d_hi = st.text_input("Option D (HI)", value=mcq.get('option_d_hi', ''))
                                    exp_hi = st.text_area("Explanation (HI)", value=mcq.get('explanation_hi', ''))
                                    
                                current_correct = mcq.get('correct', '')
                                options_list = [opt_a_en, opt_b_en, opt_c_en, opt_d_en]
                                correct_idx = 0
                                if current_correct in options_list:
                                    correct_idx = options_list.index(current_correct)
                                    
                                correct = st.selectbox("Correct Answer (select English option)", options=options_list, index=correct_idx)
                                
                                c1, c2 = st.columns(2)
                                with c1:
                                    if st.form_submit_button("Update Question"):
                                        update_mcq(mcq['id'], q_en, opt_a_en, opt_b_en, opt_c_en, opt_d_en, correct, exp_en, q_hi, opt_a_hi, opt_b_hi, opt_c_hi, opt_d_hi, exp_hi)
                                        st.success("MCQ Updated!")
                                        st.rerun()
                                with c2:
                                    if st.form_submit_button("Delete Question"):
                                        delete_mcq(mcq['id'])
                                        st.success("MCQ Deleted!")
                                        st.rerun()
                else:
                    st.info("No MCQs found for this module.")
                    
                st.subheader("➕ Add New Question")
                with st.expander("New Question Form"):
                    with st.form(f"add_mcq_{selected_mod_id}"):
                        col1, col2 = st.columns(2)
                        with col1:
                            st.markdown("**English**")
                            new_q_en = st.text_input("Question (EN)")
                            new_opt_a_en = st.text_input("Option A (EN)")
                            new_opt_b_en = st.text_input("Option B (EN)")
                            new_opt_c_en = st.text_input("Option C (EN)")
                            new_opt_d_en = st.text_input("Option D (EN)")
                            new_exp_en = st.text_area("Explanation (EN)")
                        with col2:
                            st.markdown("**Hindi**")
                            new_q_hi = st.text_input("Question (HI)")
                            new_opt_a_hi = st.text_input("Option A (HI)")
                            new_opt_b_hi = st.text_input("Option B (HI)")
                            new_opt_c_hi = st.text_input("Option C (HI)")
                            new_opt_d_hi = st.text_input("Option D (HI)")
                            new_exp_hi = st.text_area("Explanation (HI)")
                            
                        new_correct = st.selectbox("Correct Answer", options=[new_opt_a_en, new_opt_b_en, new_opt_c_en, new_opt_d_en])
                        
                        if st.form_submit_button("Add Question"):
                            if new_q_en and new_opt_a_en and new_correct:
                                add_mcq(selected_mod_id, new_q_en, new_opt_a_en, new_opt_b_en, new_opt_c_en, new_opt_d_en, new_correct, new_exp_en, new_q_hi, new_opt_a_hi, new_opt_b_hi, new_opt_c_hi, new_opt_d_hi, new_exp_hi)
                                st.success("MCQ Added!")
                                st.rerun()
                            else:
                                st.error("Please fill in at least the English Question, Option A, and Correct Answer.")

    with tab5:
        st.header('📊 Student Tracker (Vertical)')
        courses = get_all_courses()
        students = get_all_students()
        
        if courses and students:
            course_options = {c['course_id']: c['title'] for c in courses}
            selected_course_tracker = st.selectbox("Filter by Course", options=["All"] + list(course_options.keys()), format_func=lambda x: "All Courses" if x == "All" else course_options[x], key="tracker_course_filter")
            
            scores = get_all_scores()
            if not scores:
                st.info("No scores available.")
            else:
                for student in students:
                    with st.expander(f"👤 {student['name']} ({student['username']})"):
                        student_scores = [s for s in scores if s['username'] == student['username']]
                        
                        if selected_course_tracker != "All":
                            course_modules = [m['module_id'] for m in get_modules_for_course(selected_course_tracker)]
                            student_scores = [s for s in student_scores if s['module_id'] in course_modules]
                            
                        if not student_scores:
                            st.write("No assessments taken yet.")
                        else:
                            df = pd.DataFrame(student_scores)
                            avg_score = df['score'].mean()
                            st.metric("Average Score", f"{avg_score:.1f}%")
                            
                            st.write("**Assessment History:**")
                            for s in student_scores:
                                st.write(f"- **{s['module_id']}**: {s['score']}% (Date: {s.get('timestamp', 'N/A')})")
        else:
            st.info("Insufficient data (courses or students missing).")

    with tab6:
        st.header('🏆 Peer Analytics (Horizontal)')
        courses = get_all_courses()
        students = get_all_students()
        
        if courses and students:
            course_options = {c['course_id']: c['title'] for c in courses}
            selected_course_peer = st.selectbox("Filter by Course", options=["All"] + list(course_options.keys()), format_func=lambda x: "All Courses" if x == "All" else course_options[x], key="peer_course_filter")
            
            scores = get_all_scores()
            if not scores:
                st.info("No scores available to analyze.")
            else:
                student_map = {s['username']: s['name'] for s in students}
                
                filtered_scores = scores
                if selected_course_peer != "All":
                    course_modules = [m['module_id'] for m in get_modules_for_course(selected_course_peer)]
                    filtered_scores = [s for s in scores if s['module_id'] in course_modules]
                
                if filtered_scores:
                    df = pd.DataFrame(filtered_scores)
                    avg_scores = df.groupby('username')['score'].mean().reset_index()
                    avg_scores['Student Name'] = avg_scores['username'].map(student_map)
                    avg_scores = avg_scores.sort_values(by='score', ascending=False)
                    
                    st.subheader("Leaderboard (Average Score)")
                    st.dataframe(avg_scores[['Student Name', 'score']].rename(columns={'score': 'Average Score (%)'}), hide_index=True)
                    
                    st.subheader("Performance Distribution")
                    st.bar_chart(avg_scores.set_index('Student Name')['score'])
                else:
                    st.info("No assessment data for the selected criteria.")
        else:
            st.info("Insufficient data.")

if __name__ == "__main__":
    render_admin_dashboard()
