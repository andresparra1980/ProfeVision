#!/usr/bin/env python3
"""
Standalone processor for OMR forms based on the original src/ modules.
Processes an OMR form image, saves a debug image, and outputs JSON results.

Usage:
  python omr_standalone.py [image_path] [--output-json path/to/output.json] [--debug]

Example:
  python omr_standalone.py /path/to/image.jpg
  python omr_standalone.py /path/to/image.jpg --output-json results.json
  python omr_standalone.py /path/to/image.jpg --debug
"""
import sys
import json
import argparse
import cv2
import numpy as np
import os
import os.path
import shutil
from typing import Dict, Any, List, Optional, Tuple
import pathlib
from pyzbar.pyzbar import decode, ZBarSymbol
import warnings

class StandaloneOMRProcessor:
    """
    Standalone OMR processor based on the original src/ modules.
    """
    def __init__(self, debug_mode: bool = False):
        """Initialize the processor."""
        self.debug = debug_mode
        self.warped_image = None
        self.qr_roi = None
        self.bubble_roi_x_offset = 0
        self.bubble_roi_y_offset = 0
        if self.debug:
            self.debug_dir = "debug"
            os.makedirs(self.debug_dir, exist_ok=True)

    def _get_debug_path(self, original_path: str, suffix: str) -> str:
        """Helper to create a path for saving debug files."""
        base = pathlib.Path(original_path)
        safe_suffix = suffix if suffix.startswith('_') or '.' in suffix else f"_{suffix}"
        
        # If it's the final questions detected image, save it alongside the original
        if safe_suffix in ("questions_detected.jpeg", "_questions_detected.jpeg"):
            return str(base.parent / f"{base.stem}questions_detected.jpeg")
            
        # For all other debug images, use the debug directory
        if self.debug:
            if '.' in safe_suffix:
                filename = f"{base.stem}{safe_suffix}"
            else:
                filename = f"{base.stem}{safe_suffix}{base.suffix}"
            return os.path.join(self.debug_dir, filename)
        else:
            if '.' in safe_suffix:
                filename = f"{base.stem}{safe_suffix}"
            else:
                filename = f"{base.stem}{safe_suffix}{base.suffix}"
            return str(base.parent / filename)

    def _detect_form_rectangle(self, warped_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Detects the main form rectangle boundary after paper extraction.
        This handles cases where extra margins are printed around the form.
        """
        if warped_image is None:
            return None
            
        # Convert to grayscale if needed
        if len(warped_image.shape) == 3:
            gray = cv2.cvtColor(warped_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = warped_image.copy()
            
        height, width = gray.shape[:2]
        
        # Create debug image
        if self.debug:
            debug_img = warped_image.copy()
            
        # Use edge detection to find strong edges of the form
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        if self.debug:
            cv2.imwrite(self._get_debug_path("form_rect_01_edges", ".jpg"), edges)
            
        # Dilate the edges to connect any small gaps
        kernel = np.ones((3,3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=1)
        if self.debug:
            cv2.imwrite(self._get_debug_path("form_rect_02_dilated", ".jpg"), dilated)
        
        # Find contours of the dilated edges
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if self.debug:
            contour_img = warped_image.copy()
            cv2.drawContours(contour_img, contours, -1, (0, 255, 0), 2)
            cv2.imwrite(self._get_debug_path("form_rect_03_contours", ".jpg"), contour_img)
        
        # Filter contours by area and shape
        min_area_ratio = 0.5  # Form should be at least 50% of the paper
        max_area_ratio = 0.98  # And not more than 98% (allowing for some margin)
        paper_area = width * height
        
        form_contour = None
        max_valid_area = 0
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            area_ratio = area / paper_area
            
            # Skip contours that are too small or too large
            if area_ratio < min_area_ratio or area_ratio > max_area_ratio:
                continue
                
            # Check if contour is approximately rectangular
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            
            # If it has 4 vertices, it's likely a rectangle
            if len(approx) == 4:
                # Calculate aspect ratio to ensure it's reasonable
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = w / h
                
                # Form should have reasonable aspect ratio (not too narrow)
                if 0.5 <= aspect_ratio <= 2.0 and area > max_valid_area:
                    form_contour = approx
                    max_valid_area = area
        
        if form_contour is None:
            if self.debug:
                print("No valid form rectangle found, attempting alternative detection")
                
            # Try alternative method with Hough transform to find lines
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
            
            if lines is not None and self.debug:
                line_img = warped_image.copy()
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    cv2.line(line_img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.imwrite(self._get_debug_path("form_rect_04_lines", ".jpg"), line_img)
                
            # Another approach: Try with more aggressive preprocessing
            _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
            binary = 255 - binary  # Invert
            if self.debug:
                cv2.imwrite(self._get_debug_path("form_rect_05_binary", ".jpg"), binary)
                
            # Morphological operations to close gaps
            kernel = np.ones((5,5), np.uint8)
            morph = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
            if self.debug:
                cv2.imwrite(self._get_debug_path("form_rect_06_morph", ".jpg"), morph)
                
            # Find contours again with the binary image
            contours2, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if self.debug:
                contour2_img = warped_image.copy()
                cv2.drawContours(contour2_img, contours2, -1, (255, 0, 0), 2)
                cv2.imwrite(self._get_debug_path("form_rect_07_contours2", ".jpg"), contour2_img)
            
            # Try to find a rectangular contour again
            for cnt in contours2:
                area = cv2.contourArea(cnt)
                area_ratio = area / paper_area
                
                if area_ratio < 0.4 or area_ratio > 0.98:  # More lenient minimum area
                    continue
                    
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)  # More lenient approximation
                
                # Check if it's roughly rectangular (4-6 vertices)
                if 4 <= len(approx) <= 6:
                    # Further simplify to get exactly 4 points if needed
                    if len(approx) > 4:
                        approx = cv2.approxPolyDP(cnt, 0.06 * peri, True)
                    
                    if len(approx) == 4 and area > max_valid_area:
                        form_contour = approx
                        max_valid_area = area
                        break
        
        if form_contour is None:
            if self.debug:
                print("Could not find form rectangle with any method")
            return None
            
        # Order the points and perform perspective transform
        if self.debug:
            rect_img = warped_image.copy()
            cv2.drawContours(rect_img, [form_contour], -1, (0, 0, 255), 3)
            cv2.imwrite(self._get_debug_path("form_rect_08_detected", ".jpg"), rect_img)
            
        # Get the corner points in the correct order
        form_contour = form_contour.reshape(4, 2)
        rect = self._order_points(form_contour)
        
        # Calculate new dimensions while preserving aspect ratio
        width_a = np.linalg.norm(rect[1] - rect[0])
        width_b = np.linalg.norm(rect[2] - rect[3])
        height_a = np.linalg.norm(rect[3] - rect[0])
        height_b = np.linalg.norm(rect[2] - rect[1])
        
        maxWidth = max(int(width_a), int(width_b))
        maxHeight = max(int(height_a), int(height_b))
        
        # Define destination points for the transform
        dst_pts = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype=np.float32)
        
        # Get the transformation matrix
        matrix = cv2.getPerspectiveTransform(rect, dst_pts)
        
        # Warp the image
        form_warped = cv2.warpPerspective(warped_image, matrix, (maxWidth, maxHeight))
        
        if self.debug:
            print(f"Form outer rectangle detected and warped to {maxWidth}x{maxHeight}")
            cv2.imwrite(self._get_debug_path("form_rect_09_warped", ".jpg"), form_warped)

        # After warping the outer form, now detect the inner rectangle with answers
        inner_form = self._detect_inner_rectangle(form_warped)
        if inner_form is not None:
            if self.debug:
                print("Inner answer area rectangle detected")
                cv2.imwrite(self._get_debug_path("form_rect_10_inner", ".jpg"), inner_form)
            return inner_form
            
        return form_warped

    def _detect_inner_rectangle(self, form_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Detects the inner rectangle containing all the bubble answers.
        """
        if form_image is None:
            return None
            
        # Convert to grayscale if needed
        if len(form_image.shape) == 3:
            gray = cv2.cvtColor(form_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = form_image.copy()
            
        height, width = gray.shape[:2]
        
        # Crop a small margin to eliminate the outer border
        margin_percent = 0.03  # 3% margin
        margin_x = int(width * margin_percent)
        margin_y = int(height * margin_percent)
        
        if margin_x > 0 and margin_y > 0:
            # Ensure we don't go out of bounds
            if 2 * margin_x >= width or 2 * margin_y >= height:
                if self.debug:
                    print("Margins too large for cropping")
                return None
                
            # Crop the image to remove the outer border
            cropped = gray[margin_y:height-margin_y, margin_x:width-margin_x]
            if self.debug:
                cv2.imwrite(self._get_debug_path("inner_rect_01_cropped", ".jpg"), cropped)
        else:
            cropped = gray
            
        # Use adaptive thresholding to better handle lighting variations
        thresh = cv2.adaptiveThreshold(
            cropped, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, blockSize=21, C=5
        )
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("inner_rect_02_thresh", ".jpg"), thresh)
            
        # Apply morphology to clean the image and connect lines
        kernel = np.ones((3, 3), np.uint8)
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel, iterations=1)
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("inner_rect_03_morph", ".jpg"), morph)
            
        # Find contours
        contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if self.debug:
            debug_contours = cv2.cvtColor(cropped, cv2.COLOR_GRAY2BGR)
            cv2.drawContours(debug_contours, contours, -1, (0, 255, 0), 2)
            cv2.imwrite(self._get_debug_path("inner_rect_04_contours", ".jpg"), debug_contours)
            
        # Find the largest contour that is approximately rectangular
        cropped_area = cropped.shape[0] * cropped.shape[1]
        min_area_ratio = 0.4  # Inner rectangle typically covers at least 40% of the form
        max_area_ratio = 0.95  # And not more than 95%
        
        inner_contour = None
        max_valid_area = 0
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            area_ratio = area / cropped_area
            
            # Skip contours that are too small or too large
            if area_ratio < min_area_ratio or area_ratio > max_area_ratio:
                continue
                
            # Check if it's approximately rectangular
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            
            # Check for rectangular shape - 4 vertices
            if len(approx) != 4:
                continue
                
            # Get bounding rectangle and check aspect ratio
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / h
            
            # Ensure reasonable aspect ratio for the inner form
            if 0.5 <= aspect_ratio <= 2.0 and area > max_valid_area:
                inner_contour = approx
                max_valid_area = area
                
        if inner_contour is None:
            if self.debug:
                print("No inner rectangle found")
            return None
        
        # Draw the inner contour on the debug image
        if self.debug:
            debug_inner = cv2.cvtColor(cropped, cv2.COLOR_GRAY2BGR)
            cv2.drawContours(debug_inner, [inner_contour], -1, (0, 0, 255), 2)
            cv2.imwrite(self._get_debug_path("inner_rect_05_detected", ".jpg"), debug_inner)
            
        # Get the corner points of the inner contour
        inner_contour = inner_contour.reshape(4, 2)
        rect = self._order_points(inner_contour)
        
        # Adjust coordinates to account for the cropping
        if margin_x > 0 and margin_y > 0:
            rect[:, 0] += margin_x
            rect[:, 1] += margin_y
            
        # Calculate dimensions for the inner rectangle
        width_a = np.linalg.norm(rect[1] - rect[0])
        width_b = np.linalg.norm(rect[2] - rect[3])
        height_a = np.linalg.norm(rect[3] - rect[0])
        height_b = np.linalg.norm(rect[2] - rect[1])
        
        inner_width = max(int(width_a), int(width_b))
        inner_height = max(int(height_a), int(height_b))
        
        # Define destination points
        dst_pts = np.array([
            [0, 0],
            [inner_width - 1, 0],
            [inner_width - 1, inner_height - 1],
            [0, inner_height - 1]
        ], dtype=np.float32)
        
        # Get the transformation matrix and warp
        matrix = cv2.getPerspectiveTransform(rect, dst_pts)
        inner_warped = cv2.warpPerspective(form_image, matrix, (inner_width, inner_height))
        
        if self.debug:
            print(f"Inner rectangle warped to {inner_width}x{inner_height}")
            
        return inner_warped

    def _extract_paper(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Extract the paper from the background using the largest contour method (original src/preprocessor logic)."""
        if self.debug:
            print("\nExtracting paper from background (original largest contour method)...")

        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        if self.debug: cv2.imwrite(self._get_debug_path("extract_paper_01_gray", ".jpg"), gray)

        blurred = cv2.GaussianBlur(gray, (9, 9), 0)
        if self.debug: cv2.imwrite(self._get_debug_path("extract_paper_02_blurred", ".jpg"), blurred)

        thresh_value, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        if self.debug: 
            print(f"Otsu threshold value for paper extraction: {thresh_value}")
            cv2.imwrite(self._get_debug_path("extract_paper_03_binary", ".jpg"), thresh)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            if self.debug: print("No contours found (extract_paper)")
            return None
        if self.debug: print(f"Found {len(contours)} external contours (extract_paper)...")

        try:
            paper_contour = max(contours, key=cv2.contourArea)
            paper_area = cv2.contourArea(paper_contour)
        except Exception as e:
            if self.debug: print(f"Error finding largest contour: {e}")
            return None

        image_area = gray.shape[0] * gray.shape[1]
        if paper_area < (image_area * 0.4):
            if self.debug: print(f"Largest contour too small: {paper_area/image_area:.2%} of image")
            return None

        epsilon = 0.02 * cv2.arcLength(paper_contour, True)
        approx = cv2.approxPolyDP(paper_contour, epsilon, True)

        if len(approx) != 4:
            if self.debug:
                print(f"Paper contour not rectangular after approximation: {len(approx)} points")
            return None

        if self.debug:
            debug_img = image.copy()
            cv2.drawContours(debug_img, [approx], -1, (0, 255, 0), 2)
            cv2.imwrite(self._get_debug_path("extract_paper_06_paper_contour", ".jpg"), debug_img)

        pts = approx.reshape(4, 2)
        rect = np.zeros((4, 2), dtype=np.float32)
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]

        width_a = np.linalg.norm(rect[1] - rect[0])
        width_b = np.linalg.norm(rect[2] - rect[3])
        maxWidth = max(int(width_a), int(width_b))
        maxHeight = int(maxWidth * 1.414)

        dst_pts = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype=np.float32)
        
        matrix = cv2.getPerspectiveTransform(rect, dst_pts)
        warped = cv2.warpPerspective(image, matrix, (maxWidth, maxHeight))
        self.warped_image = warped  # Store original warped image for QR detection

        if self.debug:
            print(f"Paper extracted (original method) and warped to {maxWidth}x{maxHeight}")
            cv2.imwrite(self._get_debug_path("extract_paper_07_warped", ".jpg"), warped)

        return warped

    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """Order points in top-left, top-right, bottom-right, bottom-left order."""
        rect = np.zeros((4, 2), dtype=np.float32)
        
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
        
    def _get_warped_image(self) -> Optional[np.ndarray]:
        return self.warped_image

    def _extract_qr_data(self, warped_image: np.ndarray) -> Optional[str]:
        """Extract data from QR code using a more robust approach with pyzbar and OpenCV."""
        if self.debug:
            print("\nAttempting to extract QR code (robust approach)...")

        if warped_image is None:
            if self.debug:
                print("Cannot extract QR, warped image is None")
            return None
            
        if len(warped_image.shape) == 3:
            gray = cv2.cvtColor(warped_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = warped_image.copy()
            
        height, width = gray.shape[:2]

        # QR code is in the top-left corner
        roi_width = int(width * 0.5)
        roi_height = int(height * 0.5)
        roi_x = 0
        roi_y = 0

        qr_roi = gray[roi_y:roi_y + roi_height, roi_x:roi_x + roi_width]
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("qr_roi", ".png"), qr_roi)
            cv2.imwrite(self._get_debug_path("qr_preprocess_original", ".png"), qr_roi)

        attempts = []
        attempts.append(qr_roi)
        
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(qr_roi, -1, kernel)
        attempts.append(sharpened)
        
        scales = [0.8, 1.5]
        for scale in scales:
            scaled = cv2.resize(qr_roi, None, fx=scale, fy=scale)
            attempts.append(scaled)
            if self.debug:
                cv2.imwrite(self._get_debug_path(f"qr_scaled_{scale}", ".png"), scaled)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            os.environ['ZBAR_CFG_BINARY'] = "1"
            
            for i, img in enumerate(attempts):
                try:
                    qr_codes = decode(img, symbols=[ZBarSymbol.QRCODE])
                    if qr_codes:
                        qr_data = qr_codes[0].data.decode('utf-8')
                        if self.debug:
                            print(f"QR code found (attempt {i+1}): {qr_data}")
                        return qr_data
                except Exception as e:
                    if self.debug:
                        print(f"Error in QR decode attempt {i+1}: {e}")
                    continue

            # If QR not found in ROI, try full image
            try:
                qr_codes = decode(gray, symbols=[ZBarSymbol.QRCODE])
                if qr_codes:
                    qr_data = qr_codes[0].data.decode('utf-8')
                    if self.debug:
                        print(f"QR code found in full image: {qr_data}")
                    return qr_data
            except Exception as e:
                if self.debug:
                    print(f"Error decoding QR from full image: {e}")

        if self.debug:
            print("No QR code found")
        return None

    def _get_qr_roi(self) -> Optional[Dict]:
        """Return the QR code region of interest if available."""
        return self.qr_roi

    def _detect_bubbles(self, image: np.ndarray) -> Tuple[List[Dict[str, Any]], Optional[np.ndarray]]:
        """Detect and process answer bubbles using the full image."""
        if image is None:
            return [], None
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        height, width = gray.shape[:2]
        
        # First find the large rectangle ROI that contains all answers
        # Apply multiple preprocessing strategies to better handle damaged forms
        
        # Collection of binary images with different processing parameters
        thresh_methods = []
        
        # Strategy 1: Standard adaptive threshold with moderate morphology
        blurred = cv2.GaussianBlur(gray, (9, 9), 0)
        thresh1 = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=51,
            C=7
        )
        kernel = np.ones((3,3), np.uint8)
        thresh1 = cv2.morphologyEx(thresh1, cv2.MORPH_OPEN, kernel, iterations=2)
        thresh1 = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel, iterations=1)
        thresh_methods.append(thresh1)
        
        # Strategy 2: Stronger morphological operations to close larger gaps
        thresh2 = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=51,
            C=9  # Higher C value for stronger thresholding
        )
        kernel_large = np.ones((5,5), np.uint8)  # Larger kernel for closing bigger gaps
        thresh2 = cv2.morphologyEx(thresh2, cv2.MORPH_CLOSE, kernel_large, iterations=2)
        thresh2 = cv2.morphologyEx(thresh2, cv2.MORPH_OPEN, kernel, iterations=1)
        thresh_methods.append(thresh2)
        
        # Strategy 3: Otsu thresholding as a fallback
        _, thresh3 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        thresh3 = cv2.morphologyEx(thresh3, cv2.MORPH_CLOSE, kernel_large, iterations=3)
        thresh_methods.append(thresh3)
        
        # Use the first method for initial processing
        thresh = thresh_methods[0]
        
        # Find contours with the first threshold method
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if self.debug:
            debug_all_contours = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            cv2.drawContours(debug_all_contours, contours, -1, (0,255,0), 2)
            cv2.imwrite(self._get_debug_path("05_all_contours", ".png"), debug_all_contours)

        # Try all thresholding methods to find a suitable ROI
        main_roi = None
        max_area = 0
        image_area = height * width
        
        # Variables to track which method was successful
        successful_method_idx = 0
        successful_contours = contours
        
        for method_idx, method_thresh in enumerate(thresh_methods):
            # Skip first method if already processed
            if method_idx == 0:
                current_contours = contours
            else:
                # Find contours with alternative threshold method
                current_contours, _ = cv2.findContours(method_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                if self.debug:
                    debug_alt_contours = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
                    cv2.drawContours(debug_alt_contours, current_contours, -1, (0,255,0), 2)
                    cv2.imwrite(self._get_debug_path(f"05_contours_method_{method_idx+1}", ".png"), debug_alt_contours)
                    cv2.imwrite(self._get_debug_path(f"05_thresh_method_{method_idx+1}", ".png"), method_thresh)
            
            # For fallback methods, use more lenient criteria
            min_area_ratio = 0.2 if method_idx == 0 else 0.15
            min_y_percent = 0.2 if method_idx == 0 else 0.1
            max_y_percent = 0.8 if method_idx == 0 else 0.9
            min_aspect = 0.5 if method_idx == 0 else 0.3
            max_aspect = 2.0 if method_idx == 0 else 2.5
            
            # Look for valid ROIs with current method
            for cnt in current_contours:
                area = cv2.contourArea(cnt)
                if area < image_area * min_area_ratio:  # Skip if too small
                    continue
                
                x, y, w, h = cv2.boundingRect(cnt)
                ar = w / float(h)
                
                # Check if it's roughly in the middle vertically and has reasonable aspect ratio
                center_y = y + h/2
                if not (height * min_y_percent < center_y < height * max_y_percent):
                    continue
                if not (min_aspect < ar < max_aspect):
                    continue
                
                if area > max_area:
                    max_area = area
                    main_roi = (x, y, w, h)
            
            # If we found a valid ROI with this method, no need to try other methods
            if main_roi is not None and method_idx > 0:
                if self.debug:
                    print(f"Found main answer region using threshold method {method_idx+1}")
                # Store which method was successful for later use
                successful_method_idx = method_idx
                successful_contours = current_contours
                break
        
        # Update detection method if we're using fallback grid
        
        if main_roi is None:
            if self.debug:
                print("Could not find main answer region, trying fallback grid approach")
            
            # Fallback approach: Use a grid estimation based on typical OMR layout
            # In most OMR forms, the answer region covers a large central portion of the form
            margin_x = int(width * 0.1)  # 10% margin from edges
            margin_top = int(height * 0.3)  # Top 30% often contains headers/instructions
            margin_bottom = int(height * 0.1)  # Bottom often has less content
            
            fallback_x = margin_x
            fallback_y = margin_top
            fallback_w = width - (2 * margin_x)
            fallback_h = height - margin_top - margin_bottom
            
            # Use this fallback grid as our ROI
            main_roi = (fallback_x, fallback_y, fallback_w, fallback_h)
            successful_method_idx = -1  # Indicate we're using fallback grid
            
            if self.debug:
                print(f"Using fallback grid estimation for answer region: x={fallback_x}, y={fallback_y}, w={fallback_w}, h={fallback_h}")
                fallback_img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
                cv2.rectangle(fallback_img, (fallback_x, fallback_y), 
                             (fallback_x + fallback_w, fallback_y + fallback_h), (0, 255, 255), 3)
                cv2.imwrite(self._get_debug_path("05_fallback_grid", ".png"), fallback_img)
        
        x, y, w, h = main_roi
        if self.debug:
            print(f"Found main answer region: x={x}, y={y}, w={w}, h={h}")
            debug_main_roi = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            cv2.rectangle(debug_main_roi, (x,y), (x+w,y+h), (0,0,255), 2)
            cv2.imwrite(self._get_debug_path("05_main_roi", ".png"), debug_main_roi)
        
        # If we used an alternative detection method and found a good contour, perform perspective warp
        if successful_method_idx > 0:
            # Find the contour that matches our main_roi
            target_contour = None
            for cnt in successful_contours:
                cnt_x, cnt_y, cnt_w, cnt_h = cv2.boundingRect(cnt)
                if abs(cnt_x - x) < 5 and abs(cnt_y - y) < 5 and abs(cnt_w - w) < 5 and abs(cnt_h - h) < 5:
                    target_contour = cnt
                    break
            
            if target_contour is not None:
                if self.debug:
                    print(f"Applying perspective warp to detected rectangle from method {successful_method_idx+1}")
                
                # Approximate the contour to get a clean quadrilateral
                peri = cv2.arcLength(target_contour, True)
                approx = cv2.approxPolyDP(target_contour, 0.02 * peri, True)
                
                # If it's roughly a quadrilateral, perform perspective warp
                if 4 <= len(approx) <= 6:
                    # If more than 4 points, further simplify
                    if len(approx) > 4:
                        approx = cv2.approxPolyDP(target_contour, 0.04 * peri, True)
                    
                    if len(approx) == 4:
                        # Order points in correct sequence
                        rect_points = approx.reshape(4, 2)
                        rect = self._order_points(rect_points)
                        
                        # Calculate new dimensions
                        width_a = np.linalg.norm(rect[1] - rect[0])
                        width_b = np.linalg.norm(rect[2] - rect[3])
                        height_a = np.linalg.norm(rect[3] - rect[0])
                        height_b = np.linalg.norm(rect[2] - rect[1])
                        
                        maxWidth = max(int(width_a), int(width_b))
                        maxHeight = max(int(height_a), int(height_b))
                        
                        # Define destination points
                        dst_pts = np.array([
                            [0, 0],
                            [maxWidth - 1, 0],
                            [maxWidth - 1, maxHeight - 1],
                            [0, maxHeight - 1]
                        ], dtype=np.float32)
                        
                        # Get transformation matrix and warp the image
                        matrix = cv2.getPerspectiveTransform(rect, dst_pts)
                        warped_roi = cv2.warpPerspective(gray, matrix, (maxWidth, maxHeight))
                        
                        if self.debug:
                            cv2.imwrite(self._get_debug_path("05_warped_roi", ".png"), warped_roi)
                        
                        # Use the warped ROI instead of just cropping
                        gray_roi = warped_roi
                        self.bubble_roi_x_offset = 0
                        self.bubble_roi_y_offset = 0
                        # Set a flag to indicate that we've used perspective warping
                        self.perspective_warped = True
                    else:
                        # Fall back to simple cropping if we can't get exactly 4 points
                        gray_roi = gray[y:y+h, x:x+w]
                        self.bubble_roi_x_offset = x
                        self.bubble_roi_y_offset = y
                else:
                    # Fall back to simple cropping
                    gray_roi = gray[y:y+h, x:x+w]
                    self.bubble_roi_x_offset = x
                    self.bubble_roi_y_offset = y
            else:
                # Fall back to simple cropping
                gray_roi = gray[y:y+h, x:x+w]
                self.bubble_roi_x_offset = x
                self.bubble_roi_y_offset = y
        else:
            # For method 0 (standard) or fallback grid, use simple cropping
            gray_roi = gray[y:y+h, x:x+w]
            self.bubble_roi_x_offset = x
            self.bubble_roi_y_offset = y
            # Set flag to indicate no perspective warping was used
            self.perspective_warped = False
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("01_gray_roi", ".png"), gray_roi)
            
            # Save a color version of the warped ROI to draw bubbles on for debugging
            if getattr(self, 'perspective_warped', False):
                warped_roi_debug = cv2.cvtColor(gray_roi.copy(), cv2.COLOR_GRAY2BGR)
                cv2.imwrite(self._get_debug_path("05_warped_roi_color", ".png"), warped_roi_debug)

        # 1. Moderate blur to preserve bubble edges
        blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 1)
        if self.debug:
            cv2.imwrite(self._get_debug_path("02_blurred_roi", ".png"), blurred_roi)

        # 2. Use binary threshold with Otsu's method for better separation
        _, thresh_roi = cv2.threshold(blurred_roi, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # 3. Invert the image to get white bubbles on black background
        thresh_roi = cv2.bitwise_not(thresh_roi)
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("03_thresh_roi", ".png"), thresh_roi)

        # 4. Clean up noise with morphological operations
        kernel = np.ones((3,3), np.uint8)
        thresh_roi = cv2.morphologyEx(thresh_roi, cv2.MORPH_CLOSE, kernel, iterations=1)
        thresh_roi = cv2.morphologyEx(thresh_roi, cv2.MORPH_OPEN, kernel, iterations=1)
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("04_morph_roi", ".png"), thresh_roi)

        # 4. Find all contours
        contours, _ = cv2.findContours(thresh_roi.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        if self.debug:
            debug_all_contours = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
            cv2.drawContours(debug_all_contours, contours, -1, (0,255,0), 2)
            cv2.imwrite(self._get_debug_path("05_all_contours", ".png"), debug_all_contours)
            print(f"\nFound {len(contours)} contours in total")

        # Parameters for bubble detection
        min_bubble_w, max_bubble_w = 45, 85  # Wider range for width
        min_bubble_h, max_bubble_h = 50, 90  # Wider range for height
        min_bubble_ar, max_bubble_ar = 0.6, 1.4  # Even more lenient aspect ratio
        min_circularity = 0.5  # More lenient circularity threshold
        min_center_distance = 35  # Slightly reduced minimum distance

        # Detect all bubbles
        bubbles = []
        for i, cnt in enumerate(contours):
            try:
                x, y, w, h = cv2.boundingRect(cnt)
                area = cv2.contourArea(cnt)
                if area < 80: continue  # Skip very small contours

                ar = w / float(h)
                peri = cv2.arcLength(cnt, True)
                circularity = 4 * np.pi * (area / (peri**2)) if peri > 0 else 0
                
                # Primary check for well-formed bubbles
                is_bubble = (
                    min_bubble_w <= w <= max_bubble_w and
                    min_bubble_h <= h <= max_bubble_h and
                    min_bubble_ar <= ar <= max_bubble_ar and
                    circularity >= min_circularity
                )

                # Secondary check for misshapen but valid bubbles
                # These might be deformed due to heavy marking
                if not is_bubble and area > 400:  # Significant filled area
                    is_misshapen_bubble = (
                        min_bubble_w * 0.8 <= w <= max_bubble_w * 1.2 and
                        min_bubble_h * 0.8 <= h <= max_bubble_h * 1.2 and
                        0.4 <= ar <= 1.6 and  # Very lenient aspect ratio
                        circularity >= 0.3  # Much lower circularity requirement
                    )
                    is_bubble = is_misshapen_bubble

                if is_bubble:
                    # Calculate center of current bubble
                    center_x = x + w / 2.0
                    center_y = y + h / 2.0
                    
                    # Check distance to all existing bubbles
                    too_close = False
                    for existing_bubble in bubbles:
                        ex = existing_bubble['center_x']
                        ey = existing_bubble['center_y']
                        distance = np.sqrt((center_x - ex)**2 + (center_y - ey)**2)
                        if distance < min_center_distance:
                            too_close = True
                            break
                    
                    if not too_close:
                        bubble_data = {
                            'id': f'b{i}',
                            'contour': cnt, 
                            'bounds': (x, y, w, h),
                            'center_x': center_x,
                            'center_y': center_y,
                            'width': w,
                            'height': h,
                            'circularity': circularity,
                            'area': area
                        }
                        if self.debug:
                            print(f"Found bubble {i}: size={w}x{h}, ar={ar:.2f}, circ={circularity:.2f}, area={area}")
                        bubbles.append(bubble_data)

            except Exception as e:
                if self.debug:
                    print(f"Error processing contour {i}: {e}")
                continue

        if self.debug:
            print(f"\nFound {len(bubbles)} valid bubbles")
            debug_bubbles = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
            for b in bubbles:
                x, y, w, h = b['bounds']
                cv2.rectangle(debug_bubbles, (x,y), (x+w,y+h), (0,255,0), 2)
                cv2.putText(debug_bubbles, f"{w}x{h}", (x,y-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)
                # Draw center point
                center = (int(b['center_x']), int(b['center_y']))
                cv2.circle(debug_bubbles, center, 2, (0,0,255), -1)
            cv2.imwrite(self._get_debug_path("06_detected_bubbles", ".png"), debug_bubbles)

        # Sort bubbles by y-coordinate
        bubbles.sort(key=lambda b: b['center_y'])

        # Group bubbles into rows
        rows = []
        current_row = []
        row_height_tolerance = max_bubble_h * 0.5  # Reduced tolerance for better row separation

        for bubble in bubbles:
            if not current_row:
                current_row = [bubble]
            else:
                y_diff = abs(bubble['center_y'] - current_row[0]['center_y'])
                if y_diff <= row_height_tolerance:
                    current_row.append(bubble)
                else:
                    if current_row:  # Process the row if it has any bubbles
                        # Sort bubbles in row by x-coordinate
                        current_row.sort(key=lambda x: x['center_x'])
                        rows.append(current_row)
                    current_row = [bubble]

        # Don't forget to process the last row
        if current_row:
            current_row.sort(key=lambda x: x['center_x'])
            rows.append(current_row)

        # Reconstruct missing bubbles in rows
        reconstructed_rows = []
        
        # First, calculate global averages for bubble dimensions and positions
        all_bubbles = [b for row in rows for b in row]
        if len(all_bubbles) >= 8:  # Need enough bubbles for meaningful statistics
            global_avg_width = sum(b['width'] for b in all_bubbles) / len(all_bubbles)
            global_avg_height = sum(b['height'] for b in all_bubbles) / len(all_bubbles)
            
            # Get all x-positions and sort them
            all_x_positions = sorted([b['center_x'] for b in all_bubbles])
            
            # Group x-positions into clusters to identify typical bubble positions
            x_clusters = []
            current_cluster = [all_x_positions[0]]
            
            for i in range(1, len(all_x_positions)):
                if all_x_positions[i] - current_cluster[-1] < global_avg_width * 0.5:
                    # Same cluster
                    current_cluster.append(all_x_positions[i])
                else:
                    # New cluster
                    x_clusters.append(sum(current_cluster) / len(current_cluster))
                    current_cluster = [all_x_positions[i]]
            
            if current_cluster:
                x_clusters.append(sum(current_cluster) / len(current_cluster))
                
            if self.debug:
                print(f"Global bubble statistics: width={global_avg_width:.1f}, height={global_avg_height:.1f}")
                print(f"Found {len(x_clusters)} typical x-positions: {[f'{x:.1f}' for x in x_clusters]}")
        else:
            # Not enough data for global statistics, use defaults
            global_avg_width = 65
            global_avg_height = 65
            x_clusters = []
        
        for row_idx, row in enumerate(rows):
            # Skip rows with too few bubbles
            if len(row) < 2:
                reconstructed_rows.append(row)
                continue
                
            # Sort bubbles by x-coordinate
            row.sort(key=lambda b: b['center_x'])
            
            # Split into left and right columns
            image_midpoint = gray_roi.shape[1] / 2
            left_bubbles = [b for b in row if b['center_x'] < image_midpoint]
            right_bubbles = [b for b in row if b['center_x'] >= image_midpoint]
            
            # Reconstruct left column (questions 1-20)
            reconstructed_left = left_bubbles.copy()
            if left_bubbles and len(left_bubbles) < 4:  # Only reconstruct if we're missing bubbles
                # Use row-specific stats if available, otherwise fall back to global stats
                avg_width = sum(b['width'] for b in left_bubbles) / len(left_bubbles)
                avg_height = sum(b['height'] for b in left_bubbles) / len(left_bubbles)
                
                # Calculate expected x-spacing between bubbles
                x_positions = [b['center_x'] for b in left_bubbles]
                
                if len(x_positions) >= 2:
                    # Calculate spacing based on this row
                    avg_x_spacing = (max(x_positions) - min(x_positions)) / (len(x_positions) - 1)
                    
                    # Expected positions for all 4 options
                    expected_x = []
                    min_x = min(x_positions)
                    
                    # If we have global x-clusters, use them to better place reconstructed bubbles
                    if len(x_clusters) >= 4:
                        # Find which global clusters match our existing bubbles
                        matching_clusters = []
                        for x_pos in x_positions:
                            closest_cluster = min(x_clusters, key=lambda c: abs(c - x_pos))
                            matching_clusters.append(closest_cluster)
                        
                        # Get all clusters for left column
                        left_clusters = [c for c in x_clusters if c < image_midpoint]
                        if len(left_clusters) >= 4:  # We have enough clusters for all options
                            expected_x = left_clusters[:4]
                    
                    # Fallback to simple spacing if we couldn't use global clusters
                    if not expected_x:
                        for i in range(4):  # 4 options
                            expected_x.append(min_x + i * avg_x_spacing)
                    
                    # Find missing bubbles
                    reconstructed_left = []
                    for i, exp_x in enumerate(expected_x):
                        # Look for existing bubble near this position
                        found = False
                        for b in left_bubbles:
                            if abs(b['center_x'] - exp_x) < avg_width * 0.5:  # Increased tolerance
                                reconstructed_left.append(b)
                                found = True
                                break
                        
                        # If no bubble found at this position, create a placeholder
                        if not found:
                            if self.debug:
                                print(f"Reconstructing missing bubble at position {i} (option {chr(65+i)}) for question {row_idx+1}")
                            
                            placeholder = {
                                'id': f'reconstructed_left_{row_idx}_{i}',
                                'contour': None,  # No actual contour
                                'bounds': (int(exp_x - avg_width/2), int(left_bubbles[0]['center_y'] - avg_height/2), 
                                           int(avg_width), int(avg_height)),
                                'center_x': exp_x,
                                'center_y': left_bubbles[0]['center_y'],
                                'width': avg_width,
                                'height': avg_height,
                                'circularity': 0.8,  # Reasonable default
                                'area': avg_width * avg_height,
                                'is_reconstructed': True  # Mark as reconstructed
                            }
                            reconstructed_left.append(placeholder)
                    
                    # Sort reconstructed bubbles by x position
                    reconstructed_left.sort(key=lambda b: b['center_x'])
            
            # Reconstruct right column (questions 21-40)
            reconstructed_right = right_bubbles.copy()
            if right_bubbles and len(right_bubbles) < 4:  # Only reconstruct if we're missing bubbles
                # Calculate average bubble dimensions
                avg_width = sum(b['width'] for b in right_bubbles) / len(right_bubbles)
                avg_height = sum(b['height'] for b in right_bubbles) / len(right_bubbles)
                
                # Calculate expected x-spacing between bubbles
                x_positions = [b['center_x'] for b in right_bubbles]
                
                if len(x_positions) >= 2:
                    # Calculate spacing based on this row
                    avg_x_spacing = (max(x_positions) - min(x_positions)) / (len(x_positions) - 1)
                    
                    # All questions have 4 options by default
                    num_options = 4
                    
                    # Expected positions for all options
                    expected_x = []
                    min_x = min(x_positions)
                    
                    # If we have global x-clusters, use them for better placement
                    if len(x_clusters) >= 8:  # Need at least 8 clusters (4 for each column)
                        # Find which global clusters match our existing bubbles
                        matching_clusters = []
                        for x_pos in x_positions:
                            closest_cluster = min(x_clusters, key=lambda c: abs(c - x_pos))
                            matching_clusters.append(closest_cluster)
                        
                        # Get all clusters for right column
                        right_clusters = [c for c in x_clusters if c >= image_midpoint]
                        if len(right_clusters) >= 4:  # We have enough clusters for all options
                            expected_x = right_clusters[:4]
                    
                    # Fallback to simple spacing if we couldn't use global clusters
                    if not expected_x:
                        for i in range(num_options):
                            expected_x.append(min_x + i * avg_x_spacing)
                    
                    # Find missing bubbles
                    reconstructed_right = []
                    for i, exp_x in enumerate(expected_x):
                        found = False
                        for b in right_bubbles:
                            if abs(b['center_x'] - exp_x) < avg_width * 0.5:  # Increased tolerance
                                reconstructed_right.append(b)
                                found = True
                                break
                        
                        if not found:
                            if self.debug:
                                print(f"Reconstructing missing bubble at position {i} (option {chr(65+i)}) for question {row_idx+21}")
                            
                            placeholder = {
                                'id': f'reconstructed_right_{row_idx}_{i}',
                                'contour': None,
                                'bounds': (int(exp_x - avg_width/2), int(right_bubbles[0]['center_y'] - avg_height/2), 
                                           int(avg_width), int(avg_height)),
                                'center_x': exp_x,
                                'center_y': right_bubbles[0]['center_y'],
                                'width': avg_width,
                                'height': avg_height,
                                'circularity': 0.8,
                                'area': avg_width * avg_height,
                                'is_reconstructed': True
                            }
                            reconstructed_right.append(placeholder)
                    
                    # Sort reconstructed bubbles by x position
                    reconstructed_right.sort(key=lambda b: b['center_x'])
            
            # Combine left and right columns
            new_row = reconstructed_left + reconstructed_right
            reconstructed_rows.append(new_row)
        
        # Replace original rows with reconstructed ones
        rows = reconstructed_rows
        
        # Debug visualization for reconstructed rows
        if self.debug:
            debug_reconstructed = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
            for row_idx, row in enumerate(rows):
                for bubble in row:
                    x, y, w, h = bubble['bounds']
                    # Use different color for reconstructed bubbles
                    if bubble.get('is_reconstructed', False):
                        color = (255, 0, 255)  # Magenta for reconstructed
                    else:
                        color = (0, 255, 0)  # Green for original
                    
                    cv2.rectangle(debug_reconstructed, (x,y), (x+w,y+h), color, 2)
                    # Draw center point
                    center = (int(bubble['center_x']), int(bubble['center_y']))
                    cv2.circle(debug_reconstructed, center, 2, (255,255,0), -1)
            cv2.imwrite(self._get_debug_path("07_reconstructed_bubbles", ".png"), debug_reconstructed)

        if self.debug:
            print(f"\nFound {len(rows)} rows")
            for i, row in enumerate(rows):
                print(f"Row {i+1}: {len(row)} elements")

            # Debug visualization for rows
            debug_rows = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
            colors = [(0,255,0), (255,0,0), (0,0,255), (255,255,0)]
            
            # Draw midline
            cv2.line(debug_rows, 
                    (int(gray_roi.shape[1]/2), 0),
                    (int(gray_roi.shape[1]/2), gray_roi.shape[0]),
                    (255,255,255), 1)
            
            for row_idx, row in enumerate(rows):
                color = colors[row_idx % len(colors)]
                for bubble in row:
                    x, y, w, h = bubble['bounds']
                    # Color based on column
                    if bubble['center_x'] < gray_roi.shape[1]/2:
                        col_color = (0,255,0)  # Green for left column
                        q_num = row_idx + 1
                    else:
                        col_color = (0,0,255)  # Red for right column
                        q_num = row_idx + 21
                    
                    cv2.rectangle(debug_rows, (x,y), (x+w,y+h), col_color, 2)
                    cv2.putText(debug_rows, f"Q{q_num}", (x,y-5), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_color, 1)
                    # Draw center point
                    center = (int(bubble['center_x']), int(bubble['center_y']))
                    cv2.circle(debug_rows, center, 2, (255,255,0), -1)
            cv2.imwrite(self._get_debug_path("07_rows_columns", ".png"), debug_rows)

        # Convert rows to questions
        questions = []
        image_midpoint = gray_roi.shape[1] / 2
        
        for row_idx, row in enumerate(rows):
            # Split row into left and right columns
            left_bubbles = [b for b in row if b['center_x'] < image_midpoint]
            right_bubbles = [b for b in row if b['center_x'] >= image_midpoint]
            
            # Process left column question if exists
            if left_bubbles:
                left_question = {
                    'question_number': row_idx + 1,  # Questions 1-20
                    'has_frame': False,
                    'frame': None,
                    'bubbles': left_bubbles,
                    'num_options': len(left_bubbles),
                    'column': 'left'
                }
                q_data = self._process_question(gray_roi, None, left_bubbles)
                left_question.update(q_data)
                questions.append(left_question)
            
            # Process right column question if exists
            if right_bubbles:
                right_question = {
                    'question_number': row_idx + 21,  # Questions 21-40
                    'has_frame': False,
                    'frame': None,
                    'bubbles': right_bubbles,
                    'num_options': len(right_bubbles),
                    'column': 'right'
                }
                q_data = self._process_question(gray_roi, None, right_bubbles)
                right_question.update(q_data)
                questions.append(right_question)

        # Sort questions by question number
        questions.sort(key=lambda q: q['question_number'])
        return questions, gray_roi

    def _calculate_average_dims(self, elements: List[Dict]) -> Tuple[float, float]:
        if not elements:
            return 0.0, 0.0
        avg_width = np.mean([e['width'] for e in elements])
        avg_height = np.mean([e['height'] for e in elements])
        return avg_width, avg_height 

    def _find_bubble_region(self, warped_image: np.ndarray, qr_roi: Optional[Dict] = None) -> Optional[Dict]:
        """Calculates the bubble region starting from the bottom of the QR code."""
        if warped_image is None:
            return None
        
        height, width = warped_image.shape[:2]
        
        # If we have QR ROI info, start after it, otherwise use a default offset
        start_y = 0
        if qr_roi and 'height' in qr_roi and 'y' in qr_roi:
            start_y = qr_roi['y'] + qr_roi['height']
        else:
            # Default: start at 20% of the image height if no QR ROI
            start_y = int(height * 0.2)
        
        # Use almost the full width and the remaining height
        margin = 50  # Small margin from edges
        return {
            'x': margin,
            'y': start_y,
            'width': width - 2 * margin,
            'height': height - start_y - margin
        }

    def _process_question(self, gray_roi: np.ndarray, frame: Optional[Dict], bubbles: List[Dict]) -> Dict:
        """Process a single detected question (frame + bubbles or just bubbles)."""
        results = {'value': None, 'confidence': 0.0, 'is_valid': False, 'fill_ratios': []}
        if not bubbles:
            return results

        min_x = float('inf')
        min_y = float('inf')
        max_x_plus_w = float('-inf')
        max_y_plus_h = float('-inf')

        if frame:
            bx, by, bw, bh = frame.get('bounds', (0,0,0,0))
            min_x, min_y, max_x_plus_w, max_y_plus_h = bx, by, bx + bw, by + bh
        
        for bubble in bubbles:
            bx, by, bw, bh = bubble.get('bounds', (0,0,0,0))
            min_x = min(min_x, bx)
            min_y = min(min_y, by)
            max_x_plus_w = max(max_x_plus_w, bx + bw)
            max_y_plus_h = max(max_y_plus_h, by + bh)

        roi_margin = 5  # Keep small margin to avoid noise
        roi_x = max(0, int(min_x - roi_margin))
        roi_y = max(0, int(min_y - roi_margin))
        roi_w = min(gray_roi.shape[1] - roi_x, int(max_x_plus_w - min_x + 2 * roi_margin))
        roi_h = min(gray_roi.shape[0] - roi_y, int(max_y_plus_h - min_y + 2 * roi_margin))

        question_roi = gray_roi[roi_y:roi_y + roi_h, roi_x:roi_x + roi_w]
        if question_roi.size == 0:
            return results

        blurred = cv2.GaussianBlur(question_roi, (5, 5), 0)
        thresh_roi = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        fill_ratios = []
        total_pixels_list = []
        filled_pixels_list = []

        for i, bubble in enumerate(bubbles):
            # Check if this is a reconstructed bubble
            if bubble.get('is_reconstructed', False):
                # For reconstructed bubbles, set fill ratio to 0
                fill_ratios.append(0.0)
                total_pixels_list.append(0)
                filled_pixels_list.append(0)
                continue
                
            bx, by, bw, bh = bubble.get('bounds', (0,0,0,0))
            x_rel = int(bx - roi_x)
            y_rel = int(by - roi_y)
            w = int(bw)
            h = int(bh)

            x_rel = max(0, x_rel)
            y_rel = max(0, y_rel)
            if x_rel + w > question_roi.shape[1]:
                w = question_roi.shape[1] - x_rel
            if y_rel + h > question_roi.shape[0]:
                h = question_roi.shape[0] - y_rel
            
            if w <= 0 or h <= 0:
                fill_ratios.append(0.0)
                total_pixels_list.append(0)
                filled_pixels_list.append(0)
                continue

            mask = np.zeros((h, w), dtype=np.uint8)
            center = (w // 2, h // 2)
            radius = int(min(w, h) * 0.4)
            cv2.circle(mask, center, radius, 255, -1)

            bubble_roi = thresh_roi[y_rel:y_rel + h, x_rel:x_rel + w]
            
            if bubble_roi.size == 0:
                fill_ratios.append(0.0)
                total_pixels_list.append(0)
                filled_pixels_list.append(0)
                continue

            masked_bubble = cv2.bitwise_and(bubble_roi, bubble_roi, mask=mask)
            
            total_pixels = cv2.countNonZero(mask)
            filled_pixels = cv2.countNonZero(masked_bubble)
            fill_ratio = filled_pixels / total_pixels if total_pixels > 0 else 0
            
            # Debug visualization for fill ratio calculation
            if self.debug:
                debug_dir = "debug/fill_ratio"
                os.makedirs(debug_dir, exist_ok=True)
                
                # Save the original bubble ROI
                cv2.imwrite(f"{debug_dir}/bubble_{i}_original.png", bubble_roi)
                
                # Save the circular mask
                cv2.imwrite(f"{debug_dir}/bubble_{i}_mask.png", mask)
                
                # Save the masked result
                cv2.imwrite(f"{debug_dir}/bubble_{i}_masked.png", masked_bubble)
                
                # Create a visual representation
                debug_fill = cv2.cvtColor(bubble_roi, cv2.COLOR_GRAY2BGR)
                cv2.circle(debug_fill, center, radius, (0,255,0), 1)  # Green circle shows mask
                cv2.putText(debug_fill, f"Fill: {fill_ratio:.2f}", (5, h-5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,255), 1)
                cv2.imwrite(f"{debug_dir}/bubble_{i}_analysis.png", debug_fill)
            
            fill_ratios.append(fill_ratio)
            total_pixels_list.append(total_pixels)
            filled_pixels_list.append(filled_pixels)
        
        results['fill_ratios'] = [float(r) for r in fill_ratios]

        if fill_ratios:
            max_idx = np.argmax(fill_ratios)
            max_fill_ratio = fill_ratios[max_idx]
            
            sorted_ratios = sorted(fill_ratios, reverse=True)
            second_highest = sorted_ratios[1] if len(sorted_ratios) > 1 else 0
            
            # More strict thresholds since we have better binary image quality
            if max_fill_ratio > 0.35 and (len(fill_ratios) == 1 or max_fill_ratio > second_highest * 1.3):
                results['value'] = self._get_option_letter(max_idx)
                results['is_valid'] = True
                results['confidence'] = float(max_fill_ratio)

        if frame:
            fx, fy, fw, fh = frame.get('bounds', (0,0,0,0))
            results['frame'] = {
                'contour': frame.get('contour'),
                'bounds': (fx, fy, fw, fh)
            }
        else:
            results['frame'] = None
            
        results['bubbles'] = []
        for i, bubble in enumerate(bubbles):
            bx, by, bw, bh = bubble.get('bounds', (0,0,0,0))
            results['bubbles'].append({
                'contour': bubble.get('contour'),
                'bounds': (bx, by, bw, bh),
                'fill_ratio': results['fill_ratios'][i]
            })

        return results

    def _get_option_letter(self, index: int) -> str:
        """Convert bubble index (0-based) to option letter A, B, C, D."""
        if 0 <= index < 4:  # No need to change - first bubble is A, second is B, etc.
            return chr(65 + index)
        else:
            return f"?{index}"

    def _generate_debug_image(self, gray_image: np.ndarray, questions: List[Dict[str, Any]], output_image_path: str) -> None:
        """Generate debug image showing detected questions and answers."""
        if gray_image is None or not questions:
            return
        
        # Check if we used perspective warping - if so, use the warped ROI directly instead of the original image
        perspective_warped = getattr(self, 'perspective_warped', False)
        
        if perspective_warped and self.debug:
            # For warped images, use the same debug image we created in _generate_warped_debug_image
            try:
                warped_debug_path = self._get_debug_path("warped_bubbles_overlay", ".png")
                if os.path.exists(warped_debug_path):
                    # Copy the warped debug image to the output path
                    shutil.copy(warped_debug_path, output_image_path)
                    return
            except Exception as e:
                if self.debug:
                    print(f"Error using warped debug image: {e}")
        
        # If we couldn't use the warped debug image or perspective warping wasn't used,
        # generate the debug image on the original image
        debug_img = cv2.cvtColor(gray_image, cv2.COLOR_GRAY2BGR)
        x_offset = getattr(self, 'bubble_roi_x_offset', 0)
        y_offset = getattr(self, 'bubble_roi_y_offset', 0)
        
        for question in questions:
            q_num = question.get('question_number')
            if q_num is None:
                continue

            if question.get('has_frame') and isinstance(question.get('frame'), dict):
                frame = question['frame']
                contour = frame.get('contour')
                bounds = frame.get('bounds')
                try:
                    if contour is not None:
                        cnt = np.array(contour, dtype=np.int32)
                        cnt_offset = cnt + np.array([x_offset, y_offset])
                        cv2.drawContours(debug_img, [cnt_offset], -1, (255, 0, 0), 2)
                    elif bounds:
                        x, y, w, h = map(int, bounds)
                        cv2.rectangle(debug_img, (x + x_offset, y + y_offset),
                                    (x + w + x_offset, y + h + y_offset),
                                    (255, 0, 0), 2)
                    
                    if bounds:
                        x, y, w, h = map(int, bounds)
                        cv2.putText(debug_img, str(q_num), 
                                  (x + 5 + x_offset, y + h + y_offset - 5),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
                except Exception as e:
                    pass

            if isinstance(question.get('bubbles'), list):
                for b_idx, bubble_data in enumerate(question['bubbles']):
                    if not isinstance(bubble_data, dict):
                        continue
                    
                    contour = bubble_data.get('contour')
                    bounds = bubble_data.get('bounds')
                    letter = self._get_option_letter(b_idx)
                    
                    # Default color is green
                    color = (0, 255, 0)
                    
                    # Change color to blue if this is the selected answer
                    if question.get('value') == letter:
                        color = (0, 0, 255)
                        
                    # Use magenta for reconstructed bubbles
                    is_reconstructed = bubble_data.get('is_reconstructed', False)
                    if is_reconstructed:
                        if question.get('value') == letter:
                            color = (255, 0, 255)  # Magenta if selected
                        else:
                            color = (180, 0, 180)  # Darker magenta if not selected
                    
                    try:
                        if contour is not None:
                            cnt = np.array(contour, dtype=np.int32)
                            cnt_offset = cnt + np.array([x_offset, y_offset])
                            cv2.drawContours(debug_img, [cnt_offset], -1, color, 2)
                        elif bounds:
                            x, y, w, h = map(int, bounds)
                            cv2.rectangle(debug_img, (x + x_offset, y + y_offset),
                                        (x + w + x_offset, y + h + y_offset),
                                        color, 2)
                            
                            # For reconstructed bubbles, draw dashed lines
                            if is_reconstructed:
                                # Always apply offsets for consistent positioning
                                for i in range(0, h, 4):  # Draw dashed vertical lines
                                    cv2.line(debug_img, 
                                           (x + x_offset, y + y_offset + i),
                                           (x + x_offset, min(y + y_offset + i + 2, y + y_offset + h)),
                                           color, 1)
                                    cv2.line(debug_img, 
                                           (x + w + x_offset, y + y_offset + i),
                                           (x + w + x_offset, min(y + y_offset + i + 2, y + y_offset + h)),
                                           color, 1)
                                for i in range(0, w, 4):  # Draw dashed horizontal lines
                                    cv2.line(debug_img, 
                                           (x + x_offset + i, y + y_offset),
                                           (min(x + x_offset + i + 2, x + x_offset + w), y + y_offset),
                                           color, 1)
                                    cv2.line(debug_img, 
                                           (x + x_offset + i, y + h + y_offset),
                                           (min(x + x_offset + i + 2, x + x_offset + w), y + h + y_offset),
                                           color, 1)
                        
                        if bounds:
                            x, y = map(int, bounds[:2])
                            fill_ratio = question.get('fill_ratios', [])[b_idx] if b_idx < len(question.get('fill_ratios', [])) else 0
                            text_color = color
                            cv2.putText(debug_img, f"{letter}:{fill_ratio:.2f}", 
                                       (x + x_offset, y + y_offset - 5),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1)
                    except Exception as e:
                        pass
            
            if not question.get('has_frame') and isinstance(question.get('bubbles'), list) and question['bubbles']:
                first_bubble = question['bubbles'][0]
                bounds = first_bubble.get('bounds')
                if bounds:
                    try:
                        x, y = map(int, bounds[:2])
                        cv2.putText(debug_img, str(q_num), 
                                  (x - 20 + x_offset, y + y_offset + 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)
                    except Exception as e:
                        pass

        try:
            cv2.imwrite(output_image_path, debug_img)
        except Exception as e:
            pass

    def _generate_warped_debug_image(self, questions: List[Dict[str, Any]]) -> None:
        """Generate a debug image showing detected bubbles directly on the warped ROI."""
        if not hasattr(self, 'perspective_warped') or not self.perspective_warped:
            return  # Only create this debug for perspective warped images
        
        if not questions or not self.debug:
            return
            
        # Get the warped ROI image (should be grayscale)
        try:
            warped_roi_path = self._get_debug_path("05_warped_roi_color", ".png")
            warped_debug = cv2.imread(warped_roi_path)
            if warped_debug is None:
                # Try to create it from the grayscale warped ROI
                warped_roi_gray_path = self._get_debug_path("05_warped_roi", ".png")
                if os.path.exists(warped_roi_gray_path):
                    warped_roi_gray = cv2.imread(warped_roi_gray_path, cv2.IMREAD_GRAYSCALE)
                    if warped_roi_gray is not None:
                        warped_debug = cv2.cvtColor(warped_roi_gray, cv2.COLOR_GRAY2BGR)
                        cv2.imwrite(warped_roi_path, warped_debug)
                    else:
                        return
                else:
                    return
        except Exception as e:
            if self.debug:
                print(f"Error loading warped ROI for debug: {e}")
            return
            
        # Draw bubbles directly on the warped image without any offsets
        for question in questions:
            q_num = question.get('question_number')
            if q_num is None:
                continue
                
            # Draw question bounds
            contour = question.get('contour')
            bounds = question.get('bounds')
            
            if contour is not None:
                cnt = np.array(contour, dtype=np.int32)
                cv2.drawContours(warped_debug, [cnt], -1, (255, 0, 0), 2)
            elif bounds:
                x, y, w, h = map(int, bounds)
                cv2.rectangle(warped_debug, (x, y), (x + w, y + h), (255, 0, 0), 2)
            
            # Draw question number at top-left in BLUE (BGR format)
            if bounds:
                x, y, w, h = map(int, bounds)
                # Draw prominent question number label with better visibility
                # First draw a black background for contrast
                cv2.putText(warped_debug, str(q_num), 
                           (x - 20, y + 30),  # Position to left of question
                           cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 0, 0), 4)  # Black outline for visibility
                # Then draw the blue number on top
                cv2.putText(warped_debug, str(q_num), 
                           (x - 20, y + 30),  # Position to left of question
                           cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 0, 0), 2)  # BLUE in BGR format
            
            # Draw bubbles
            if isinstance(question.get('bubbles'), list):
                for b_idx, bubble_data in enumerate(question['bubbles']):
                    if not isinstance(bubble_data, dict):
                        continue
                    
                    contour = bubble_data.get('contour')
                    bounds = bubble_data.get('bounds')
                    letter = self._get_option_letter(b_idx)
                    
                    # Determine if this bubble is filled
                    is_filled = False
                    is_selected = False
                    fill_ratio = 0.0
                    
                    if b_idx < len(question.get('fill_ratios', [])):
                        fill_ratio = question['fill_ratios'][b_idx]
                        # Use a default threshold of 0.6 if fill_threshold is not defined
                        threshold = getattr(self, 'fill_threshold', 0.6)
                        is_filled = fill_ratio >= threshold
                    
                    if question.get('answer_index') == b_idx:
                        is_selected = True
                        
                    # Choose color based on status
                    if is_filled:
                        color = (0, 0, 255)  # RED for filled bubbles (BGR format)
                    else:
                        color = (0, 255, 0)  # GREEN for non-filled bubbles (BGR format)
                    
                    # Draw the bubble directly on warped image (no offsets)
                    if contour is not None:
                        cnt = np.array(contour, dtype=np.int32)
                        cv2.drawContours(warped_debug, [cnt], -1, color, 2)
                    elif bounds:
                        x, y, w, h = map(int, bounds)
                        cv2.rectangle(warped_debug, (x, y), (x + w, y + h), color, 2)
                        
                    # Add fill ratio label
                    if bounds:
                        x, y = map(int, bounds[:2])
                        cv2.putText(warped_debug, f"{letter}:{fill_ratio:.2f}", 
                                   (x, y - 5),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Save the debug image
        output_path = self._get_debug_path("warped_bubbles_overlay", ".png")
        cv2.imwrite(output_path, warped_debug)
        if self.debug:
            print(f"Saved warped debug overlay to {output_path}")
    
    def process_image(self, image_path: str, already_warped: bool = False) -> Dict[str, Any]:
        """Process the OMR image and return results.
        
        Args:
            image_path: Path to the image file
            already_warped: If True, skip paper extraction and form detection (for pre-processed images from ML Kit)
        """
        try:
            original_image = cv2.imread(image_path)
            if original_image is None:
                return {"success": False, "error": f"Could not load image: {image_path}"}

            bubble_warped_source_image: Optional[np.ndarray] = None
            
            if already_warped:
                # Image is already pre-processed (e.g., from ML Kit scanner)
                # Skip paper extraction and form detection, go directly to bubble detection
                if self.debug:
                    print("already_warped=True: Skipping paper extraction and form detection")
                self.warped_image = original_image
                bubble_warped_source_image = original_image
            else:
                # Normal flow: extract paper and detect form rectangle
                warped = self._extract_paper(original_image)
                if warped is None:
                    # If paper extraction failed, try to use the original image directly
                    # This might happen for already well-cropped images or very damaged ones
                    warped = original_image
                    # Ensure self.warped_image is set for QR detection if _extract_paper didn't set it
                    if self.warped_image is None:
                        self.warped_image = warped
                    if self.debug:
                        cv2.imwrite(self._get_debug_path("00_original_as_warped", ".png"), warped)
                
                # Detect inner rectangle for bubble detection
                # Try to find the form rectangle first
                form_warped = self._detect_form_rectangle(warped) # 'warped' is from _extract_paper or original
                
                if form_warped is not None:
                    if self.debug:
                        print("Using detected form rectangle as base for bubble detection")
                    bubble_warped_source_image = form_warped
                else:
                    if self.debug:
                        print("No form rectangle detected, using extracted paper (or original) as base for bubble detection")
                    bubble_warped_source_image = warped # This is the fallback
            
            # QR detection - use the warped image
            raw_qr_data = self._extract_qr_data(self.warped_image)
            qr_output = raw_qr_data if raw_qr_data else ""

            # Bubble detection using the appropriate image
            # _detect_bubbles might further refine the ROI, e.g., by perspective warping
            questions_processed, final_gray_roi_for_bubbles = self._detect_bubbles(bubble_warped_source_image)

            answers_list = []
            valid_question_count = 0
            for q in questions_processed:
                if q.get('is_valid', False):
                    valid_question_count += 1
                answers_list.append({
                    "number": q.get('question_number'),
                    "value": q.get('value') if q.get('is_valid') else None,
                    "confidence": q.get('confidence', 0.0),
                    "num_options": q.get('num_options', len(q.get('bubbles', [])))
                })

            answers_list.sort(key=lambda x: x['number'] if x.get('number') is not None else float('inf'))

            result_json = {
                "success": True,
                "qr_data": qr_output,
                "total_questions": len(questions_processed),
                "answered_questions": valid_question_count,
                "answers": answers_list
            }

            # Always generate the final debug image, regardless of debug mode
            debug_image_path = self._get_debug_path(image_path, "questions_detected.jpeg")
            
            image_to_pass_to_generate_debug: Optional[np.ndarray] = None
            if getattr(self, 'perspective_warped', False) and final_gray_roi_for_bubbles is not None:
                # If perspective warping occurred, use the exact ROI that bubbles were detected on.
                # Offsets (self.bubble_roi_x_offset, self.bubble_roi_y_offset) should be 0 in this case,
                # as set by _detect_bubbles when perspective_warped is True.
                image_to_pass_to_generate_debug = final_gray_roi_for_bubbles
            elif bubble_warped_source_image is not None:
                # Otherwise, use the broader bubble_warped_source_image (could be form_warped or original warped)
                # Offsets will be used by _generate_debug_image to place bubbles correctly.
                if len(bubble_warped_source_image.shape) == 3:
                    image_to_pass_to_generate_debug = cv2.cvtColor(bubble_warped_source_image, cv2.COLOR_BGR2GRAY)
                else:
                    image_to_pass_to_generate_debug = bubble_warped_source_image.copy()

            if image_to_pass_to_generate_debug is not None:
                self._generate_debug_image(image_to_pass_to_generate_debug, questions_processed, debug_image_path)
            else:
                if self.debug:
                    print("Skipping _generate_debug_image as the base image for it is None.")
            
            # Generate a debug image showing bubbles directly on the warped ROI if perspective warping was used
            if self.debug and getattr(self, 'perspective_warped', False):
                self._generate_warped_debug_image(questions_processed)

            return result_json

        except Exception as e:
            return {"success": False, "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description='Process OMR forms, save debug image, and output JSON.')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--output-json', help='Path to save the output JSON file (optional)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode with intermediate images and verbose output')
    args = parser.parse_args()
    
    processor = StandaloneOMRProcessor(debug_mode=args.debug)
    result = processor.process_image(args.image_path)

    if args.output_json:
        with open(args.output_json, 'w') as f:
            json.dump(result, f, indent=None, separators=(',', ':'))
        if args.debug:
            print(f"JSON output saved to: {args.output_json}")
    else:
        print(json.dumps(result, indent=None, separators=(',', ':')))

if __name__ == '__main__':
    main() 