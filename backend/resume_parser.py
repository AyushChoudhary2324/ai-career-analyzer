import pdfplumber
import os

def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text()
    return text

if __name__ == "__main__":
    # Test it with a sample pdf
    test_path = "test_resume.pdf"
    if os.path.exists(test_path):
        text = extract_text_from_pdf(test_path)
        print(text)
    else:
        print("Put a test_resume.pdf file in backend folder to test!")