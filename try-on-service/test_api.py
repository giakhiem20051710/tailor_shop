"""
Test script for Virtual Try-On API
Creates sample images and tests the /api/try-on endpoint
"""

import os
import requests
from PIL import Image
import io

# API URL
API_URL = "http://localhost:8084"

def create_test_images():
    """Create simple test images for testing"""
    # Create test_images directory
    os.makedirs("test_images", exist_ok=True)
    
    # Create a simple person placeholder image (solid color with text)
    person_img = Image.new('RGB', (400, 600), color=(200, 150, 150))
    person_img.save("test_images/person.jpg")
    print("[OK] Created test_images/person.jpg")
    
    # Create a simple garment placeholder image
    garment_img = Image.new('RGB', (400, 400), color=(100, 150, 200))
    garment_img.save("test_images/garment.jpg")
    print("[OK] Created test_images/garment.jpg")
    
    return "test_images/person.jpg", "test_images/garment.jpg"

def test_health():
    """Test health endpoint"""
    print("\n[TEST] Testing /api/health...")
    response = requests.get(f"{API_URL}/api/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_root():
    """Test root endpoint"""
    print("\n[TEST] Testing /...")
    response = requests.get(f"{API_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_try_on(person_path, garment_path):
    """Test virtual try-on endpoint"""
    print("\n[TEST] Testing /api/try-on...")
    print(f"   Person image: {person_path}")
    print(f"   Garment image: {garment_path}")
    
    with open(person_path, 'rb') as person_file, open(garment_path, 'rb') as garment_file:
        files = {
            'person_image': ('person.jpg', person_file, 'image/jpeg'),
            'garment_image': ('garment.jpg', garment_file, 'image/jpeg'),
        }
        data = {'category': 'upper_body'}
        
        print("   Sending request (this may take a while on CPU)...")
        response = requests.post(f"{API_URL}/api/try-on", files=files, data=data)
        
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        # Save result image
        result_path = "test_images/result.png"
        with open(result_path, 'wb') as f:
            f.write(response.content)
        print(f"   [OK] Result saved to: {result_path}")
        
        # Show processing time
        processing_time = response.headers.get('X-Processing-Time', 'N/A')
        print(f"   [TIME] Processing time: {processing_time}s")
        return True
    else:
        print(f"   [ERROR] Error: {response.text}")
        return False

def main():
    print("=" * 50)
    print("Virtual Try-On API Test Suite")
    print("=" * 50)
    
    # Create test images
    print("\n[INFO] Creating test images...")
    person_path, garment_path = create_test_images()
    
    # Run tests
    results = []
    results.append(("Root endpoint", test_root()))
    results.append(("Health check", test_health()))
    results.append(("Try-On", test_try_on(person_path, garment_path)))
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    for name, passed in results:
        status = "[PASSED]" if passed else "[FAILED]"
        print(f"   {name}: {status}")
    
    all_passed = all(r[1] for r in results)
    print("\n" + ("All tests passed!" if all_passed else "Some tests failed"))
    
    return all_passed

if __name__ == "__main__":
    main()
