from .roboflow_kiri_ocr_service import RoboflowKiriOCRService


class OCRService:
    """
    Service for processing Cambodian National ID cards.
    Uses Roboflow v6 for field detection and Kiri OCR for text recognition.
    """

    def __init__(self):
        self.service = RoboflowKiriOCRService()

    def process_id_card(self, image_file):
        return self.service.process_id_card(image_file)