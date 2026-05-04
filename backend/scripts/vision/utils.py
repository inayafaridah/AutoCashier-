import collections

class DetectionStabilizer:
    def __init__(self, window_size=10, stability_threshold=5):
        """
        Anti-flicker system using majority voting.
        :param window_size: Number of frames to store in buffer.
        :param stability_threshold: Minimum occurrences to confirm detection.
        """
        self.buffer = collections.deque(maxlen=window_size)
        self.stability_threshold = stability_threshold

    def add_detection(self, class_name):
        self.buffer.append(class_name)

    def get_stable_result(self):
        if not self.buffer:
            return None
        
        # Count frequencies
        counts = collections.Counter(self.buffer)
        most_common, frequency = counts.most_common(1)[0]
        
        # Only return if detection is stable (above threshold)
        if frequency >= self.stability_threshold:
            return most_common
        return None

# Product Price Mapping
PRODUCT_PRICES = {
    "coca_cola_can": 5000,
    "indomie_goreng": 3000,
    "le_minerale": 4000,
    "r_roti_tawar": 15000,
    "chitato": 12000,
    "bottle": 5000,
    "cup": 3000,
    "apple": 2000,
    "orange": 2500,
    "banana": 1500,
}

# Classes that should NEVER be detected as products
NON_PRODUCT_BLACKLIST = {
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 
    'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign', 
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 
    'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 
    'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 
    'surfboard', 'tennis racket', 'chair', 'couch', 'potted plant', 'bed', 
    'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 
    'hair drier', 'toothbrush'
}

def is_valid_product(class_name):
    """
    Validates if a class name is a registered product and not in the blacklist.
    """
    if class_name in NON_PRODUCT_BLACKLIST:
        return False
    return class_name in PRODUCT_PRICES

def get_product_price(product_name):
    """Returns price from mapping or None if not found."""
    return PRODUCT_PRICES.get(product_name)
