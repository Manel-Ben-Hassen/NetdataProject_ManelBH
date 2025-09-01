import os
import time
import pandas as pd
import google.generativeai as genai

# ---------------------
# Configuration
# ---------------------

# Hardcode your Gemini API key here (⚠ Keep private!)
API_KEY = "AIzaSyDPwGifjGdeBp_NzNI42j85cg2TsKqiRBU"  # Replace with your API key from Google AI Studio
genai.configure(api_key=API_KEY)

# Model choice (Gemini multimodal model for OCR)
MODEL_NAME = "gemini-2.0-flash"  # Or "gemini-1.5-flash" / "gemini-1.5-pro"

# Directories
DATASET_DIR = os.path.join("..", "dataset", "images")
OUTPUT_DIR = os.path.join("..", "ocr_results")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Create model instance
model = genai.GenerativeModel(MODEL_NAME)

# ---------------------
# Processing
# ---------------------

results = []

for filename in os.listdir(DATASET_DIR):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        image_path = os.path.join(DATASET_DIR, filename)
        print(f"Processing: {filename}")

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        start_time = time.time()
        try:
            response = model.generate_content(
                [
                    {
                        "mime_type": "image/jpeg",  
                        "data": image_bytes
                    },
                    "Extract all text from this image as plain text."
                ]
            )
            elapsed_time = round(time.time() - start_time, 2)

            # Extract recognized text
            full_text = response.text if hasattr(response, "text") else ""

            results.append({
                "file": filename,
                "time_s": elapsed_time,
                "full_text": full_text.strip()
            })

        except Exception as e:
            print(f" Error processing {filename}: {e}")

# ---------------------
# Save Results
# ---------------------

df = pd.DataFrame(results)
csv_path = os.path.join(OUTPUT_DIR, "results_gemini.csv")
df.to_csv(csv_path, index=False, encoding="utf-8")

print(f"\nOCR completed. Results saved to: {csv_path}")
