import streamlit as st
import pandas as pd
from database import (
    get_all_lectures, get_lecture, get_mcqs,
    mark_module_complete, is_module_complete, get_completed_modules,
    save_score, get_student_scores, get_best_scores,
    get_all_students, get_all_scores,
    get_enrolled_courses, get_modules_for_course,
    get_enrolled_students, is_enrolled
)
from mock_api import bulbul_text_to_speech
from content import PLS_PHASE_CONFIG
from state_manager import get_username, get_phase_config

def render_student_dashboard():
    tab1, tab2, tab3, tab4 = st.tabs([
        '📥 My Lectures', '✍️ Evaluation', '📊 My Progress', '🏆 Peer Comparison'
    ])

    username = get_username()
    enrolled_courses = get_enrolled_courses(username)
    completed = get_completed_modules(username)

    # Tab 1: My Lectures
    with tab1:
        st.header('📥 My Lectures')
        
        if not enrolled_courses:
            st.warning('⚠️ You are not enrolled in any courses yet. Please contact admin.')
        else:
            for course in enrolled_courses:
                st.subheader(f"📘 {course['title']}")
                st.caption(course['description'])
                
                modules = get_modules_for_course(course['course_id'])
                
                if not modules:
                    st.info('No modules found for this course.')
                    continue
                
                completed_count = sum(1 for m in modules if m['module_id'] in completed)
                st.write(f"**Progress:** {completed_count} / {len(modules)} modules completed")
                st.progress(completed_count / len(modules) if len(modules) > 0 else 0)
                
                for module in modules:
                    module_id = module['module_id']
                    is_completed = module_id in completed
                    status_badge = '✅ Completed' if is_completed else '📖 Not Completed'
                    
                    with st.expander(f"{module['title']} — {status_badge}"):
                        lang = st.radio('🌐 Select Language:', ['English', 'Hindi'], key=f'lang_{module_id}', horizontal=True)
                        
                        raw_text = module.get('english', '') if lang == 'English' else module.get('hindi', '')
                        if raw_text:
                            paragraphs = [p.strip() for p in raw_text.strip().split('\n') if p.strip()]
                            formatted = '\n\n'.join(paragraphs)
                            st.markdown(formatted)
                        
                        with st.expander('📝 Lecture Notes'):
                            notes_raw = module.get('notes_en', '') if lang == 'English' else module.get('notes_hi', '')
                            if notes_raw:
                                lines = notes_raw.strip().split('\n')
                                formatted_notes = []
                                for line in lines:
                                    line = line.strip()
                                    if not line: continue
                                    cleaned = line.lstrip('•-* ').strip()
                                    if cleaned:
                                        formatted_notes.append(f'- {cleaned}')
                                st.markdown('\n'.join(formatted_notes))
                            else:
                                st.info("No notes available.")
                        
                        if st.button('🔊 Listen to Audio', key=f'audio_{module_id}'):
                            with st.spinner('Generating audio...'):
                                bulbul_text_to_speech(raw_text, lang)
                            st.audio('placeholder_audio.wav')
                        
                        if not is_completed:
                            if st.button('Mark as Complete', key=f'complete_{module_id}'):
                                mark_module_complete(username, module_id)
                                st.rerun()
                            st.info('ℹ️ Complete reading this module to unlock its evaluation.')
                        else:
                            st.success('🎉 Module completed! Evaluation unlocked.')
                
                st.divider()

    # Tab 2: Evaluation
    with tab2:
        st.header('✍️ Module Evaluation')
        
        if not completed:
            st.warning('⚠️ You have not completed any modules yet.')
            st.info('ℹ️ Complete a module in the "My Lectures" tab to unlock its evaluation.')
        else:
            all_course_modules = []
            for c in enrolled_courses:
                all_course_modules.extend(get_modules_for_course(c['course_id']))
                
            available_evals = [m for m in all_course_modules if m['module_id'] in completed]
            
            if not available_evals:
                st.info("No evaluations available for your completed modules.")
            else:
                module_options = {m['module_id']: m['title'] for m in available_evals}
                module_select = st.selectbox('Select Module to Evaluate:', options=list(module_options.keys()), format_func=lambda x: module_options[x])
                
                eval_lang = st.radio('🌐 Evaluation Language', ['English', 'Hindi'], key='eval_language', horizontal=True)
                
                questions = get_mcqs(module_select)
                if not questions:
                    st.info('No questions available for this module.')
                else:
                    with st.form(f'eval_form_{module_select}'):
                        answers = []
                        for idx, q in enumerate(questions):
                            if eval_lang == 'Hindi' and q.get('question_hi'):
                                q_text = q['question_hi']
                                opts = [q.get('option_a_hi',''), q.get('option_b_hi',''), q.get('option_c_hi',''), q.get('option_d_hi','')]
                            else:
                                q_text = q['question']
                                opts = [q.get('option_a',''), q.get('option_b',''), q.get('option_c',''), q.get('option_d','')]
                            
                            st.markdown(f"**Question {idx+1}:** {q_text}")
                            ans = st.radio('Select your answer:', opts, key=f'mcq_{module_select}_{idx}')
                            answers.append((ans, idx, q))
                            st.write("---")
                            
                        submitted = st.form_submit_button('Submit Evaluation')
                        
                        if submitted:
                            score = 0
                            total = len(questions)
                            
                            st.subheader("Results Breakdown")
                            for ans, idx, q in answers:
                                correct_letter = None
                                if q['correct'] == q['option_a']: correct_letter = 'a'
                                elif q['correct'] == q['option_b']: correct_letter = 'b'
                                elif q['correct'] == q['option_c']: correct_letter = 'c'
                                elif q['correct'] == q['option_d']: correct_letter = 'd'
                                
                                if eval_lang == 'Hindi' and q.get('question_hi'):
                                    correct_text = q.get(f'option_{correct_letter}_hi', '') if correct_letter else ''
                                else:
                                    correct_text = q.get('correct', '')
                                
                                is_correct = ans == correct_text
                                if is_correct:
                                    score += 1
                                    
                                if eval_lang == 'Hindi' and q.get('question_hi'):
                                    q_text = q['question_hi']
                                    exp_text = q.get('explanation_hi', q.get('explanation', ''))
                                else:
                                    q_text = q['question']
                                    exp_text = q.get('explanation', '')
                                
                                with st.expander(f"Q{idx+1}: {q_text}"):
                                    if is_correct:
                                        st.success(f"✅ Your Answer: {ans}")
                                    else:
                                        st.error(f"❌ Your Answer: {ans}")
                                        st.info(f"Correct Answer: {correct_text}")
                                    st.write(f"**Explanation:** {exp_text}")
                            
                            perc = (score / total) * 100
                            if perc >= 90: pls_phase = 4
                            elif perc >= 70: pls_phase = 3
                            elif perc >= 50: pls_phase = 2
                            else: pls_phase = 1
                            
                            save_score(username, module_select, score, total, pls_phase)
                            
                            st.metric("Final Score", f"{score}/{total} ({perc:.1f}%)")
                            st.metric("PLS Phase Reached", pls_phase)
                            if perc >= 70:
                                st.balloons()
                            st.success("Score saved successfully!")

    # Tab 3: My Progress
    with tab3:
        st.header('📊 My Progress')
        scores_list = get_student_scores(username)
        scores_df = pd.DataFrame(scores_list) if scores_list else pd.DataFrame()
        
        if not enrolled_courses:
            st.info("You are not enrolled in any courses.")
        else:
            for course in enrolled_courses:
                st.subheader(f"📘 {course['title']}")
                modules = get_modules_for_course(course['course_id'])
                mod_ids = [m['module_id'] for m in modules]
                
                course_completed = len([m for m in completed if m in mod_ids])
                total_mods = len(modules)
                st.write(f"**Modules Completed:** {course_completed} / {total_mods}")
                st.progress(course_completed / total_mods if total_mods > 0 else 0)
                
                if not scores_df.empty:
                    course_scores = scores_df[scores_df['module_id'].isin(mod_ids)]
                    if not course_scores.empty:
                        avg_score = (course_scores['score'] / course_scores['total']).mean() * 100
                        st.metric("Average Course Score", f"{avg_score:.1f}%")
                        
                        st.write("Detailed Module Performance:")
                        display_df = course_scores[['module_id', 'score', 'total', 'pls_phase', 'timestamp']].copy()
                        display_df['Percentage'] = (display_df['score'] / display_df['total'] * 100).round(1).astype(str) + '%'
                        st.dataframe(display_df, use_container_width=True)
                    else:
                        st.info("No evaluations completed for this course yet.")
                else:
                    st.info("No evaluations completed for this course yet.")
                st.divider()

    # Tab 4: Peer Comparison
    with tab4:
        st.header('🏆 Peer Comparison')
        st.caption('Anonymous comparison across ALL learners (regardless of language)')
        
        all_scores_list = get_all_scores()
        all_scores_df = pd.DataFrame(all_scores_list) if all_scores_list else pd.DataFrame()
        all_students = get_all_students()  # list of dicts with 'username', 'name'
        
        if not all_students:
            st.info("No student data available.")
        elif all_scores_df.empty:
            st.info("No evaluation data available across the platform yet.")
        else:
            # Compute leaderboard metrics
            leaderboard_data = []
            for i, student in enumerate(all_students):
                s_username = student['username']
                
                # Filter scores for this student
                if not all_scores_df.empty and 'username' in all_scores_df.columns:
                    student_scores = all_scores_df[all_scores_df['username'] == s_username]
                else:
                    student_scores = pd.DataFrame()
                
                student_completed = len(get_completed_modules(s_username))
                
                if not student_scores.empty:
                    avg_perc = (student_scores['score'] / student_scores['total']).mean() * 100
                    best_phase = int(student_scores['pls_phase'].max())
                else:
                    avg_perc = 0
                    best_phase = 0
                    
                display_name = 'You ⭐' if s_username == username else f'Learner {chr(65 + i)}'
                
                leaderboard_data.append({
                    'Student': display_name,
                    'Username': s_username,
                    'Average Score %': avg_perc,
                    'Modules Completed': student_completed,
                    'Best Phase': best_phase
                })
            
            ldf = pd.DataFrame(leaderboard_data).sort_values('Average Score %', ascending=False).reset_index(drop=True)
            ldf['Rank'] = ldf.index + 1
            
            your_rank = ldf[ldf['Username'] == username]['Rank'].values[0] if username in ldf['Username'].values else "N/A"
            total_students = len(ldf)
            
            col1, col2 = st.columns(2)
            col1.metric("Your Rank", f"{your_rank} / {total_students}")
            if your_rank != "N/A" and total_students > 1:
                percentile = ((total_students - your_rank) / (total_students - 1)) * 100
                col2.metric("Percentile", f"Top {100 - percentile:.1f}%")
            
            st.write("### 🥇 Leaderboard")
            display_cols = ['Rank', 'Student', 'Average Score %', 'Modules Completed', 'Best Phase']
            st.dataframe(ldf[display_cols], use_container_width=True, hide_index=True)
            
            # Bar chart for module performance vs class average
            if not scores_df.empty and not all_scores_df.empty:
                st.write("### 📊 Module Performance vs Class Average")
                
                module_avgs = all_scores_df.groupby('module_id').apply(lambda x: (x['score'] / x['total']).mean() * 100).reset_index(name='Class Average')
                your_scores = scores_df.groupby('module_id').apply(lambda x: (x['score'] / x['total']).mean() * 100).reset_index(name='Your Score')
                
                comparison = pd.merge(your_scores, module_avgs, on='module_id', how='left')
                comparison.set_index('module_id', inplace=True)
                
                st.bar_chart(comparison)

