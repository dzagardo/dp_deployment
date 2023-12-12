from abc import ABC, abstractmethod

class DPAlgorithm(ABC):
    @abstractmethod
    def generate_synthetic_data(self, data, sample_size, epsilon, delta, lower_clip, upper_clip):
        pass
