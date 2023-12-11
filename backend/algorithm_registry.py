class AlgorithmRegistry:
    algorithms = {}

    @classmethod
    def register_algorithm(cls, name, algorithm_cls):
        cls.algorithms[name] = algorithm_cls()  # Create an instance immediately

    @classmethod
    def get_algorithm(cls, name):
        algorithm_instance = cls.algorithms.get(name)
        if algorithm_instance is None:
            raise ValueError(f"Algorithm {name} not registered")
        return algorithm_instance
