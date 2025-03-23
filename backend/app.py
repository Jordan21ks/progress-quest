from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
import jwt
from functools import wraps

app = Flask(__name__)
# Configure CORS
allowed_origins = [
    'https://experiencepoints.app',  # Production
    'http://experiencepoints.app',   # Production HTTP (redirects to HTTPS)
    'http://localhost:8080'         # Local development
]

CORS(app, resources={r"/api/*": {
    "origins": "*" if DEBUG else allowed_origins,  # Allow all origins in development
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Add DELETE method
    "allow_headers": ["Content-Type", "Authorization"],
    "expose_headers": ["Content-Type"]
}})

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
if not app.config['SECRET_KEY']:
    raise ValueError('No SECRET_KEY set for Flask application')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///experience_points.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Environment-specific settings
DEBUG = os.environ.get('FLASK_ENV') == 'development'

db = SQLAlchemy(app)

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    goals = db.relationship('Goal', backref='user', lazy=True)

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    current = db.Column(db.Float, nullable=False)
    target = db.Column(db.Float, nullable=False)
    level = db.Column(db.Integer, default=1)
    deadline = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(20), nullable=False)  # 'skill' or 'financial'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    history = db.relationship('History', backref='goal', lazy=True)

class History(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    value = db.Column(db.Float, nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey('goal.id'), nullable=False)

# Templates
TEMPLATES = {
    'clean_slate': {
        'name': 'The Clean Slate',
        'description': 'Add your own skills + goals',
        'skills': []
    },
    'hybrid_athlete': {
        'name': 'The Hybrid Athlete',
        'skills': [
            {'name': 'Hyrox Training', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Padel', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Reformer Pilates', 'current': 5, 'target': 10, 'level': 1},
            {'name': 'French', 'current': 2, 'target': 100, 'level': 1}
        ]
    },
    'racketmaster': {
        'name': 'The Racketmaster',
        'skills': [
            {'name': 'Padel', 'current': 5, 'target': 10, 'level': 1},
            {'name': 'Tennis', 'current': 7, 'target': 20, 'level': 1},
            {'name': 'Squash', 'current': 3, 'target': 20, 'level': 1},
            {'name': 'Badminton', 'current': 2, 'target': 10, 'level': 1}
        ]
    },
    'financial_assassin': {
        'name': 'The Financial Assassin',
        'financial': [
            {'name': 'ETF Savings', 'current': 2000, 'target': 10000, 'level': 1},
            {'name': 'Cash Savings', 'current': 1000, 'target': 3000, 'level': 1},
            {'name': 'House Savings', 'current': 2000, 'target': 20000, 'level': 1}
        ]
    },
    'hyrox_monster': {
        'name': 'The Hyrox Monster',
        'skills': [
            {'name': '1km Running', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Skierg', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Row', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Sled Push', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Burpee Broad Jumps', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Sandbag Lunges', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Sled Pull', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Wall Balls', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Farmers Carry', 'current': 1, 'target': 10, 'level': 1}
        ]
    },
    'polyglot': {
        'name': 'The Polyglot',
        'skills': [
            {'name': 'French', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Spanish', 'current': 1, 'target': 10, 'level': 1},
            {'name': 'Japanese', 'current': 1, 'target': 10, 'level': 1}
        ]
    }
}



def goal_to_dict(goal):
    return {
        'id': goal.id,
        'name': goal.name,
        'current': goal.current,
        'target': goal.target,
        'level': goal.level,
        'deadline': goal.deadline.isoformat() if goal.deadline else None,
        'type': goal.type,
        'history': [{'date': h.date.isoformat(), 'value': h.value} for h in goal.history]
    }

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    template = data.get('template')
    
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    # Password validation
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    # Check if password contains both letters and numbers
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return jsonify({'error': 'Password must contain both letters and numbers'}), 400
        
    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    if template and template in TEMPLATES:
        template_data = TEMPLATES[template]
        default_deadline = datetime.now() + timedelta(days=90)
        
        # Add skills
        if 'skills' in template_data:
            for skill in template_data['skills']:
                goal = Goal(
                    name=skill['name'],
                    current=skill['current'],
                    target=skill['target'],
                    level=skill['level'],
                    type='skill',
                    deadline=default_deadline,
                    user_id=user.id
                )
                db.session.add(goal)
                history = History(date=datetime.now(), value=skill['current'], goal=goal)
                db.session.add(history)
        
        # Add financial goals
        if 'financial' in template_data:
            for fin in template_data['financial']:
                goal = Goal(
                    name=fin['name'],
                    current=fin['current'],
                    target=fin['target'],
                    level=fin['level'],
                    type='financial',
                    deadline=default_deadline,
                    user_id=user.id
                )
                db.session.add(goal)
                history = History(date=datetime.now(), value=fin['current'], goal=goal)
                db.session.add(history)
        
        db.session.commit()
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username
            }
        })
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/logout')
def logout():
    return jsonify({'message': 'Logout successful'})

@app.route('/api/templates')
def get_templates():
    return jsonify({
        'templates': [
            {
                'id': key,
                'name': value['name'],
                'skills': value.get('skills', [])
            } 
            for key, value in TEMPLATES.items()
        ]
    })

@app.route('/api/goals')
@token_required
def get_goals(current_user):
    goals = current_user.goals
    return jsonify({
        'skills': [goal_to_dict(g) for g in goals if g.type == 'skill'],
        'financial': [goal_to_dict(g) for g in goals if g.type == 'financial']
    })

@app.route('/api/goals', methods=['POST'])
@token_required
def update_goal(current_user):
    data = request.get_json()
    
    # If no ID is provided, create a new goal
    if not data.get('id'):
        goal = Goal(
            name=data.get('name'),
            current=data.get('current', 0),
            target=data.get('target', 10),
            level=1,
            type=data.get('type', 'skill'),
            deadline=datetime.fromisoformat(data.get('deadline')) if data.get('deadline') else (datetime.now() + timedelta(days=90)),
            user_id=current_user.id
        )
        db.session.add(goal)
        history = History(date=datetime.now(), value=goal.current, goal=goal)
        db.session.add(history)
        db.session.commit()
        return jsonify(goal_to_dict(goal))
    
    # Update existing goal
    goal = Goal.query.get(data.get('id'))
    if not goal or goal.user_id != current_user.id:
        return jsonify({'error': 'Goal not found'}), 404
    
    goal.name = data.get('name', goal.name)
    goal.current = data.get('current', goal.current)
    goal.target = data.get('target', goal.target)
    goal.deadline = datetime.fromisoformat(data.get('deadline')) if data.get('deadline') else goal.deadline
    
    history = History(date=datetime.now(), value=goal.current, goal=goal)
    db.session.add(history)
    db.session.commit()
    
    return jsonify(goal_to_dict(goal))

# Dynamic facts database
DYNAMIC_FACTS = {
    'Tennis': [
        'Studies show tennis players have a 9.7 year increase in life expectancy compared to sedentary individuals.',
        'Tennis improves bone density by 3-7% annually when played regularly.',
        'Players make approximately 4 decisions per second during points, enhancing cognitive function.'
    ],
    'BJJ': [
        'BJJ practitioners burn 400-800 calories per hour, more than most cardio activities.',
        'Regular BJJ practice improves core strength by 40% within the first year.',
        'Clinical studies show BJJ reduces stress levels by up to 25% through mindful practice.'
    ],
    'Cycling': [
        'Cycling 30 minutes daily reduces heart disease risk by 50%.',
        'Cyclists have the cardiovascular fitness of someone 10 years younger.',
        'Cycling burns 400-600 calories per hour, even at moderate intensity.'
    ],
    'Skiing': [
        'Skiing burns 400-600 calories per hour while building core strength.',
        'Skiing improves balance and coordination by 20-30%.',
        'Skiing engages 95% of major muscle groups simultaneously.'
    ],
    'Padel': [
        'Padel improves agility and reaction time by 15-20%.',
        'Padel burns 400-600 calories per hour.',
        'Padel enhances hand-eye coordination by 25-30%.'
    ],
    'Spanish': [
        'Bilingual individuals have 4-5 years delayed onset of cognitive decline.',
        'Language learning improves memory capacity by 15-20%.',
        'Spanish fluency opens access to 22 countries and 500+ million speakers.'
    ],
    'Pilates': [
        'Clinical studies show Pilates reduces chronic back pain by 36%.',
        'Pilates improves core strength by 20-30% within 12 weeks.',
        'Pilates enhances flexibility by 15-20% in major muscle groups.'
    ],
    'Cooking': [
        'Home cooking reduces food expenses by 50-60% compared to dining out.',
        'Home-cooked meals contain 60% less sodium and 50% less calories.',
        'Cooking skills correlate with 20-30% higher diet quality scores.'
    ],
    'Debt Repayment': [
        'Prioritizing high-interest debt can save thousands in interest payments.',
        'Starting debt repayment early can reduce total interest by over 50%.',
        'Consistent debt payments can reduce repayment time by years.'
    ],
    'Default': [
        'Consistent practice leads to measurable improvements in skill mastery.',
        'Regular goal tracking increases success rate by up to 40%.',
        'Breaking goals into smaller milestones improves completion rates by 25%.'
    ]
}

# Dynamic fact fetching
@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(current_user, goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal or goal.user_id != current_user.id:
        return jsonify({'error': 'Goal not found'}), 404
    
    # Delete associated history
    History.query.filter_by(goal_id=goal.id).delete()
    
    # Delete the goal
    db.session.delete(goal)
    db.session.commit()
    
    return jsonify({'message': 'Goal deleted successfully'})

@app.route('/api/facts', methods=['POST'])
@token_required
def get_fact(current_user):
    data = request.get_json()
    search_term = data.get('searchTerm')
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    try:
        # Extract activity name from search term
        activity = next((key for key in DYNAMIC_FACTS.keys() 
                        if key.lower() in search_term.lower()), 'Default')
        
        # Get facts for the activity
        facts = DYNAMIC_FACTS[activity]
        
        # Return a random fact
        import random
        fact = random.choice(facts)
        
        return jsonify({'fact': fact})
        
    except Exception as e:
        print('Error fetching fact:', e)
        return jsonify({'error': 'Failed to fetch fact'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
