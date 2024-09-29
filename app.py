from flask import Flask, render_template, request, jsonify
from kmeans import KMeans
import numpy as np

app = Flask(__name__)


data = None
kmeans_state = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_data', methods=['POST'])
def generate_data():
    global data
    n_samples = 300
    n_features = 2
    n_clusters = int(request.json['n_clusters'])
    data = np.random.randn(n_samples, n_features) * 0.5
    for i in range(n_clusters):
        center = np.random.randn(n_features) * 4
        data[i*(n_samples//n_clusters):(i+1)*(n_samples//n_clusters)] += center
    return jsonify({'data': data.tolist()})

@app.route('/initialize', methods=['POST'])
def initialize():
    global kmeans_state
    method = request.json['method']
    n_clusters = int(request.json['n_clusters'])
    kmeans = KMeans(n_clusters=n_clusters)
    if method == 'manual':
        kmeans.centroids = np.array(request.json['centroids'])
    else:
        kmeans.initialize_centroids(data, method)
    kmeans_state = kmeans
    return jsonify({
        'centroids': kmeans.centroids.tolist(),
        'labels': None
    })

@app.route('/step', methods=['POST'])
def step():
    global kmeans_state
    centroids, labels = kmeans_state.step(data)
    return jsonify({
        'centroids': centroids.tolist(),
        'labels': labels.tolist()
    })

@app.route('/converge', methods=['POST'])
def converge():
    global kmeans_state
    centroids, labels = kmeans_state.fit(data)
    return jsonify({
        'centroids': centroids.tolist(),
        'labels': labels.tolist()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)