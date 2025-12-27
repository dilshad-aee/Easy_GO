#!/usr/bin/env python3
"""
Quiz App - Flask Backend
Simple server for serving quiz questions
"""

from flask import Flask, jsonify, send_from_directory, request
import json
import os
import random

app = Flask(__name__, static_folder='static', static_url_path='')

# where the question files live
PACK_DIR = os.path.join(os.path.dirname(__file__), 'pack')
JSON_PACK_DIR = os.path.join(os.path.dirname(__file__), 'json pack')

def load_questions_from_file(filepath):
    """Load questions from a JSON file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            questions = json.load(f)
            return questions if isinstance(questions, list) else []
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def get_all_questions():
    """Load all questions from pack directories"""
    all_questions = []
    
    # check pack/ dir
    if os.path.exists(PACK_DIR):
        for filename in os.listdir(PACK_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(PACK_DIR, filename)
                questions = load_questions_from_file(filepath)
                all_questions.extend(questions)
    
    # check json pack/ dir
    if os.path.exists(JSON_PACK_DIR):
        for filename in os.listdir(JSON_PACK_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(JSON_PACK_DIR, filename)
                questions = load_questions_from_file(filepath)
                all_questions.extend(questions)
    
    return all_questions

@app.route('/')
def index():
    """Main page"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

@app.route('/api/questions/all')
def get_all_questions_api():
    """Get all questions with optional filtering"""
    try:
        questions = get_all_questions()
        
        # query params
        limit = request.args.get('limit', type=int)
        shuffle = request.args.get('shuffle', 'false').lower() == 'true'
        
        if shuffle:
            random.shuffle(questions)
        
        if limit and limit > 0:
            questions = questions[:limit]
        
        return jsonify({
            'success': True,
            'questions': questions,
            'total': len(questions)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/questions/<chapter_id>')
def get_chapter_questions(chapter_id):
    """Get questions for a specific chapter/topic"""
    try:
        all_questions = get_all_questions()
        
        # filter by topic
        if chapter_id != 'all':
            filtered = [q for q in all_questions if q.get('topic', '').lower() == chapter_id.lower()]
        else:
            filtered = all_questions
        
        # query params
        limit = request.args.get('limit', type=int)
        shuffle = request.args.get('shuffle', 'false').lower() == 'true'
        
        if shuffle:
            random.shuffle(filtered)
        
        if limit and limit > 0:
            filtered = filtered[:limit]
        
        return jsonify({
            'success': True,
            'questions': filtered,
            'total': len(filtered)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/topics')
def get_topics():
    """Get list of all available topics"""
    try:
        questions = get_all_questions()
        topics = set()
        
        for q in questions:
            if 'topic' in q and q['topic']:
                topics.add(q['topic'])
        
        return jsonify({
            'success': True,
            'topics': sorted(list(topics)),
            'total': len(topics)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats')
def get_stats():
    """Get statistics about available questions"""
    try:
        questions = get_all_questions()
        topics = {}
        
        for q in questions:
            topic = q.get('topic', 'Uncategorized')
            topics[topic] = topics.get(topic, 0) + 1
        
        return jsonify({
            'success': True,
            'totalQuestions': len(questions),
            'totalTopics': len(topics),
            'topicBreakdown': topics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files')
def get_available_files():
    """Get list of available question files"""
    try:
        files = []
        
        # check pack/ directory
        if os.path.exists(PACK_DIR):
            for filename in os.listdir(PACK_DIR):
                if filename.endswith('.json'):
                    filepath = os.path.join(PACK_DIR, filename)
                    questions = load_questions_from_file(filepath)
                    files.append({
                        'name': filename.replace('.json', ''),
                        'filename': filename,
                        'directory': 'pack',
                        'questionCount': len(questions)
                    })
        
        # check json pack/ directory
        if os.path.exists(JSON_PACK_DIR):
            for filename in os.listdir(JSON_PACK_DIR):
                if filename.endswith('.json'):
                    filepath = os.path.join(JSON_PACK_DIR, filename)
                    questions = load_questions_from_file(filepath)
                    files.append({
                        'name': filename.replace('.json', ''),
                        'filename': filename,
                        'directory': 'json pack',
                        'questionCount': len(questions)
                    })
        
        return jsonify({
            'success': True,
            'files': files,
            'total': len(files)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # create dirs if needed
    os.makedirs(PACK_DIR, exist_ok=True)
    os.makedirs(JSON_PACK_DIR, exist_ok=True)
    
    print("="*60)
    print("Quiz Application Server")
    print("="*60)
    print(f"Pack directory: {PACK_DIR}")
    print(f"JSON Pack directory: {JSON_PACK_DIR}")
    print()
    
    # load and show stats
    questions = get_all_questions()
    print(f"Loaded {len(questions)} questions")
    
    topics = set(q.get('topic', 'Uncategorized') for q in questions)
    print(f"Available topics: {len(topics)}")
    print()
    print("Starting server on http://localhost:5001")
    print("="*60)
    
    app.run(debug=True, host='0.0.0.0', port=5001)
