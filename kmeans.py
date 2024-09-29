import numpy as np

class KMeans:
    def __init__(self, n_clusters=3, max_iter=100):
        self.n_clusters = n_clusters
        self.max_iter = max_iter
        self.centroids = None
        self.labels = None

    def initialize_centroids(self, X, method='random'):
        if method == 'random':
            idx = np.random.choice(len(X), self.n_clusters, replace=False)
            self.centroids = X[idx]
        elif method == 'farthest_first':
            self.centroids = [X[np.random.randint(len(X))]]
            for _ in range(1, self.n_clusters):
                dist = np.array([min([np.inner(c-x,c-x) for c in self.centroids]) for x in X])
                self.centroids.append(X[np.argmax(dist)])
            self.centroids = np.array(self.centroids)
        elif method == 'kmeans++':
            self.centroids = [X[np.random.randint(len(X))]]
            for _ in range(1, self.n_clusters):
                dist = np.array([min([np.inner(c-x,c-x) for c in self.centroids]) for x in X])
                self.centroids.append(X[np.random.choice(len(X), p=dist/sum(dist))])
            self.centroids = np.array(self.centroids)

    def assign_clusters(self, X):
        distances = np.sqrt(((X - self.centroids[:, np.newaxis])**2).sum(axis=2))
        self.labels = np.argmin(distances, axis=0)

    def update_centroids(self, X):
        for k in range(self.n_clusters):
            if np.sum(self.labels == k) > 0:
                self.centroids[k] = X[self.labels == k].mean(axis=0)

    def fit(self, X):
        self.assign_clusters(X)
        for _ in range(self.max_iter):
            old_centroids = self.centroids.copy()
            self.update_centroids(X)
            self.assign_clusters(X)
            if np.all(old_centroids == self.centroids):
                break
        return self.centroids, self.labels

    def step(self, X):
        if self.labels is None:
            self.assign_clusters(X)
        else:
            old_centroids = self.centroids.copy()
            self.update_centroids(X)
            self.assign_clusters(X)
        return self.centroids, self.labels