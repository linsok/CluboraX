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
        except Exception as e:
            self.available = False
            self.error_message = str(e)

    def process_id_card(self, image_file):
        if not self.available:
            return {
                "success": False,
                "message": "OCR service is not available on this server.",
                "error": f"OCR Initialization failed: {self.error_message}. Please check package installations and ensure your model weights are placed under 'backend/ocr_models/'."
            }
        return self.service.process_id_card(image_file)