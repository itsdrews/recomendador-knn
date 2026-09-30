import numpy as np

class NearestNeighborsCustom:
    def __init__(self, n_neighbors=3, metric='cosine'):
        self.n_neighbors = n_neighbors
        self.metric = metric
        self.X_train = None

    def _cosine_distance(self, a, b):
        norm_a = np.linalg.norm(a, axis=1, keepdims=True)
        norm_b = np.linalg.norm(b, axis=1, keepdims=True)
        
        # Evita divisão por zero se o vetor for nulo
        norm_a[norm_a == 0] = 1e-10
        norm_b[norm_b == 0] = 1e-10

        a_normalized = a / norm_a
        b_normalized = b / norm_b
        similarity = np.dot(a_normalized, b_normalized.T)
        
        # Garante intervalo [-1.0, 1.0] sem estouro numérico
        similarity = np.clip(similarity, -1.0, 1.0)
        return 1.0 - similarity

    def _pearson_distance(self, a, b):
        """
        Calcula a distância de Pearson vetorizada considerando a média APENAS das notas > 0.
        """
        # Centraliza 'a'
        mask_a = a > 0
        sum_a = np.sum(a, axis=1, keepdims=True)
        count_a = np.sum(mask_a, axis=1, keepdims=True)
        mean_a = np.divide(sum_a, count_a, out=np.zeros_like(sum_a), where=count_a > 0)
        a_centered = np.where(mask_a, a - mean_a, 0.0)

        # Centraliza 'b'
        mask_b = b > 0
        sum_b = np.sum(b, axis=1, keepdims=True)
        count_b = np.sum(mask_b, axis=1, keepdims=True)
        mean_b = np.divide(sum_b, count_b, out=np.zeros_like(sum_b), where=count_b > 0)
        b_centered = np.where(mask_b, b - mean_b, 0.0)

        return self._cosine_distance(a_centered, b_centered)

    def fit(self, X):
        # Indentação corrigida aqui:
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
        elif self.metric == 'pearson':
            distances_matrix = self._pearson_distance(X_query, self.X_train)
        elif self.metric == 'euclidean':
            distances_matrix = np.sqrt(
                np.sum((X_query[:, np.newaxis, :] - self.X_train[np.newaxis, :, :]) ** 2, axis=-1)
            )
        else:
            raise ValueError(f"Métrica '{self.metric}' não suportada.")

        all_indices = np.argsort(distances_matrix, axis=1)[:, :n_neighbors]
        all_distances = np.take_along_axis(distances_matrix, all_indices, axis=1)

        return all_distances, all_indices