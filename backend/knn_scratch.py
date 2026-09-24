import numpy as np

class NearestNeighborsCustom:
    def __init__(self, n_neighbors=3, metric='cosine'):
        self.n_neighbors = n_neighbors
        self.metric = metric
        self.X_train = None

    def _cosine_distance(self, a, b):
        norm_a = np.linalg.norm(a, axis=1, keepdims=True)
        norm_b = np.linalg.norm(b, axis=1, keepdims=True)
        a_normalized = a / (norm_a + 1e-10)
        b_normalized = b / (norm_b + 1e-10)
        similarity = np.dot(a_normalized, b_normalized.T)
        return 1.0 - similarity

    def fit(self, X):
        self.X_train = np.array(X, dtype=np.float64)
        return self

    def kneighbors(self, X_query, n_neighbors=None):
        if n_neighbors is None:
            n_neighbors = self.n_neighbors
            
        X_query = np.array(X_query, dtype=np.float64)
        if X_query.ndim == 1:
            X_query = X_query.reshape(1, -1)

        if self.metric == 'cosine':
            distances_matrix = self._cosine_distance(X_query, self.X_train)
        elif self.metric == 'euclidean':
            distances_matrix = np.sqrt(np.sum((X_query[:, np.newaxis, :] - self.X_train[np.newaxis, :, :]) ** 2, axis=-1))
        else:
            raise ValueError(f"Métrica '{self.metric}' não suportada.")

        all_indices = np.argsort(distances_matrix, axis=1)[:, :n_neighbors]
        all_distances = np.take_along_axis(distances_matrix, all_indices, axis=1)

        return all_distances, all_indices