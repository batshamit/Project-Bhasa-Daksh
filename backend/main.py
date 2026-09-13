from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_database, seed_default_data

# Import all route modules
from routes.auth_routes import router as auth_router
from routes.course_routes import router as course_router
from routes.lecture_routes import router as lecture_router
from routes.eval_routes import router as eval_router
from routes.user_routes import router as user_router
from routes.enroll_routes import router as enroll_router
from routes.progress_routes import router as progress_router
from routes.analytics_routes import router as analytics_router

app = FastAPI(title='Bhasha-Daksh API', version='4.0')

# CORS - allow local and deployed frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Include routers
app.include_router(auth_router, prefix='/api/auth', tags=['Auth'])
app.include_router(course_router, prefix='/api/courses', tags=['Courses'])
app.include_router(lecture_router, prefix='/api/lectures', tags=['Lectures'])
app.include_router(eval_router, prefix='/api/evaluations', tags=['Evaluations'])
app.include_router(user_router, prefix='/api/users', tags=['Users'])
app.include_router(enroll_router, prefix='/api/enrollments', tags=['Enrollments'])
app.include_router(progress_router, prefix='/api/progress', tags=['Progress'])
app.include_router(analytics_router, prefix='/api/analytics', tags=['Analytics'])

@app.on_event('startup')
def startup():
    init_database()
    seed_default_data()

@app.get('/')
def root():
    return {'message': 'Bhasha-Daksh API v4.0'}
