class OCRService:
    """
    Service for processing Cambodian National ID cards.
    Uses Roboflow v6 for field detection and Kiri OCR for text recognition.
    """

    def __init__(self):
        try:
            from .roboflow_kiri_ocr_service import RoboflowKiriOCRService
            self.service = RoboflowKiriOCRService()
            self.available = True
        except ImportError as e:
            self.available = False
            self.import_error = str(e)

    def process_id_card(self, image_file):
        if not self.available:
            return {
                "success": False,
                "message": "OCR service is not available on this server.",
                "error": f"Required packages are missing: {self.import_error}. Please install 'kiri_ocr' and 'ultralytics' to use this feature."
            }
        return self.service.process_id_card(image_file)