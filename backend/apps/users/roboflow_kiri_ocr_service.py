import os
import re
import traceback
#import requests
from datetime import datetime
from pathlib import Path

from django.conf import settings
from PIL import Image
from kiri_ocr import OCR
from ultralytics import YOLO


class RoboflowKiriOCRService:
    def __init__(self):
        print("LOCAL OCR INIT 1: starting service")

        self.upload_folder = Path(settings.MEDIA_ROOT) / "id_cards"
        self.crop_folder = Path(settings.MEDIA_ROOT) / "id_card_crops"

        self.upload_folder.mkdir(parents=True, exist_ok=True)
        self.crop_folder.mkdir(parents=True, exist_ok=True)

        self.kiri_model_path = settings.KIRI_OCR_MODEL_PATH
        self.detector_model_path = settings.LOCAL_FIELD_DETECTOR_MODEL_PATH

        if not os.path.exists(self.detector_model_path):
            raise RuntimeError(f"Local field detector model not found: {self.detector_model_path}")

        print("LOCAL OCR INIT 2: loading Kiri OCR")
        self.ocr = OCR(
            model_path=self.kiri_model_path,
            decode_method="beam",
            device="cpu"
        )

        print("LOCAL OCR INIT 3: loading local YOLO detector")
        self.detector = YOLO(self.detector_model_path)

        print("LOCAL OCR INIT 4: service ready")

    def process_id_card(self, image_file):
        try:
            print("OCR STEP 1: saving uploaded image")

            filename = f"id_card_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image_file.name}"
            file_path = self.upload_folder / filename

            with open(file_path, "wb") as f:
                for chunk in image_file.chunks():
                    f.write(chunk)

            print("OCR STEP 2: running local YOLO detector")
            predictions = self._detect_fields(file_path)
            print("Detected fields:", list(predictions.keys()))

            print("OCR STEP 3: cropping fields")
            crops = self._crop_fields(file_path, predictions)

            print("OCR STEP 4: running Kiri OCR")
            raw_fields = self._ocr_crops(crops)

            print("OCR STEP 5: postprocessing")
            extracted_data = self._postprocess(raw_fields)

            extracted_data["id_card_image_path"] = f"id_cards/{filename}"
            extracted_data["document_type"] = "Khmer National ID Card"
            extracted_data["raw_fields"] = raw_fields

            print("OCR STEP 6: finished successfully")

            return {
                "success": True,
                "data": extracted_data,
                "message": "Khmer National ID Card processed successfully"
            }

        except Exception as e:
            print("OCR ERROR:")
            print(traceback.format_exc())

            return {
                "success": False,
                "error": str(e),
                "message": "Failed to process ID card with Local YOLO + Kiri OCR"
            }



    def _detect_fields(self, image_path):
            results = self.detector.predict(
                source=str(image_path),
                conf=0.25,
                imgsz=640,
                verbose=False
            )

            best = {}

            if not results:
                return best

            result = results[0]
            names = result.names

            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = names[cls_id]
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                width = x2 - x1
                height = y2 - y1
                x_center = x1 + width / 2
                y_center = y1 + height / 2

                pred = {
                    "class": cls_name,
                    "confidence": confidence,
                    "x": x_center,
                    "y": y_center,
                    "width": width,
                    "height": height,
                }

                if cls_name not in best or confidence > best[cls_name]["confidence"]:
                    best[cls_name] = pred

            return best

    def _crop_fields(self, image_path, predictions):
        image = Image.open(image_path).convert("RGB")
        image_w, image_h = image.size

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        current_crop_folder = self.crop_folder / timestamp
        current_crop_folder.mkdir(parents=True, exist_ok=True)

        crops = {}
        padding = 8

        for cls, pred in predictions.items():
            x = pred["x"]
            y = pred["y"]
            w = pred["width"]
            h = pred["height"]

            left = int(x - w / 2) - padding
            top = int(y - h / 2) - padding
            right = int(x + w / 2) + padding
            bottom = int(y + h / 2) + padding

            left = max(0, left)
            top = max(0, top)
            right = min(image_w, right)
            bottom = min(image_h, bottom)

            crop = image.crop((left, top, right, bottom))
            crop_path = current_crop_folder / f"{cls}.jpg"
            crop.save(crop_path, quality=95)

            crops[cls] = crop_path

        return crops

    def _ocr_crops(self, crops):
        field_order = [
            "id_number",
            "khmer_name",
            "latin_name",
            "dob",
            "gender",
            "height",
            "birth_place",
            "address1",
            "address2",
            "validity",
            "body_mark",
            "mrz1",
            "mrz2",
            "mrz3",
        ]

        raw = {}

        for field in field_order:
            crop_path = crops.get(field)

            if not crop_path:
                raw[field] = ""
                continue

            try:
                text, details = self.ocr.extract_text(str(crop_path))
                raw[field] = self._clean_text(text)
            except Exception:
                raw[field] = ""

        return raw

    def _clean_text(self, text):
        if not text:
            return ""
        text = text.strip()
        text = text.replace("\n", " ")
        text = " ".join(text.split())
        return text

    def _khmer_to_arabic_digits(self, text):
        khmer_digits = "០១២៣៤៥៦៧៨៩"
        arabic_digits = "0123456789"
        return text.translate(str.maketrans(khmer_digits, arabic_digits))

    def _digits_only(self, text):
        text = self._khmer_to_arabic_digits(text or "")
        return "".join(re.findall(r"\d", text))

    def _clean_id_number(self, text):
        digits = self._digits_only(text)
        return digits[:9]

    def _clean_gender(self, text):
        if "ស្រី" in text or "F" in text.upper():
            return "Female"
        if "ប្រុស" in text or "M" in text.upper():
            return "Male"
        return text

    def _clean_height(self, text):
        digits = self._digits_only(text)
        if len(digits) >= 3:
            return digits[:3] + " cm"
        return text

    def _clean_dob(self, text):
        digits = self._digits_only(text)

        if len(digits) >= 8:
            d = digits[:2]
            m = digits[2:4]
            y = digits[4:8]
            return f"{m}/{d}/{y}"

        return ""

    def _clean_validity_expiry(self, text):
        digits = self._digits_only(text)

        if len(digits) >= 16:
            d2 = digits[8:10]
            m2 = digits[10:12]
            y2 = digits[12:16]
            return f"{m2}/{d2}/{y2}"

        if len(digits) >= 8:
            d = digits[-8:-6]
            m = digits[-6:-4]
            y = digits[-4:]
            return f"{m}/{d}/{y}"

        return ""

    def _latin_name_from_mrz3(self, mrz3):
        if not mrz3:
            return ""

        text = mrz3.upper()
        text = text.replace(" ", "")
        text = "".join(ch for ch in text if ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ<")

        if "<<" in text:
            parts = [p for p in text.split("<<") if p]
            return " ".join(parts).replace("<", " ").strip()

        return ""

    def _postprocess(self, raw):
        latin_name = raw.get("latin_name", "")
        mrz_name = self._latin_name_from_mrz3(raw.get("mrz3", ""))

        if not re.search(r"[A-Z]", latin_name.upper()) and mrz_name:
            latin_name = mrz_name

        name = raw.get("khmer_name", "")
        if mrz_name:
            name = mrz_name

        return {
            "name": name,
            "latin_name": latin_name,
            "id_number": self._clean_id_number(raw.get("id_number", "")),
            "date_of_birth": self._clean_dob(raw.get("dob", "")),
            "gender": self._clean_gender(raw.get("gender", "")),
            "nationality": "Cambodian",
            "department": "",
            "degree": "",
            "address": self._clean_text(
                raw.get("address1", "") + " " + raw.get("address2", "")
            ),
            "place_of_birth": self._clean_text(raw.get("birth_place", "")),
            "issue_date": "",
            "expiry_date": self._clean_validity_expiry(raw.get("validity", "")),
            "passport_number": "",
        }