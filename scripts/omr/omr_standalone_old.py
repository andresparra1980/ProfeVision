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
        if safe_suffix == "questions_detected.jpeg":
            return str(base.parent / f"{base.stem}{safe_suffix}")
            
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
        self.warped_image = warped

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

    def _detect_bubbles(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect and process answer bubbles using the full image."""
        if image is None:
            return []
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        height, width = gray.shape[:2]
        
        # First find the large rectangle ROI that contains all answers
        blurred = cv2.GaussianBlur(gray, (9, 9), 0)
        thresh = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=51,
            C=7
        )
        
        kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)

        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if self.debug:
            debug_all_contours = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            cv2.drawContours(debug_all_contours, contours, -1, (0,255,0), 2)
            cv2.imwrite(self._get_debug_path("05_all_contours", ".png"), debug_all_contours)

        # Find the largest rectangle in the middle of the page
        main_roi = None
        max_area = 0
        image_area = height * width
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < image_area * 0.2:  # Skip if too small
                continue
            
            x, y, w, h = cv2.boundingRect(cnt)
            ar = w / float(h)
            
            # Check if it's roughly in the middle vertically and has reasonable aspect ratio
            center_y = y + h/2
            if not (height * 0.2 < center_y < height * 0.8):
                continue
            if not (0.5 < ar < 2.0):
                continue
            
            if area > max_area:
                max_area = area
                main_roi = (x, y, w, h)
        
        if main_roi is None:
            if self.debug:
                print("Could not find main answer region")
            return []
        
        x, y, w, h = main_roi
        if self.debug:
            print(f"Found main answer region: x={x}, y={y}, w={w}, h={h}")
            debug_main_roi = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            cv2.rectangle(debug_main_roi, (x,y), (x+w,y+h), (0,0,255), 2)
            cv2.imwrite(self._get_debug_path("05_main_roi", ".png"), debug_main_roi)
        
        # Extract the ROI for bubble detection
        gray_roi = gray[y:y+h, x:x+w]
        self.bubble_roi_x_offset = x
        self.bubble_roi_y_offset = y
        
        if self.debug:
            cv2.imwrite(self._get_debug_path("01_gray_roi", ".png"), gray_roi)

        # 1. Moderate blur to preserve bubble edges
        blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 1)
        if self.debug:
            cv2.imwrite(self._get_debug_path("02_blurred_roi", ".png"), blurred_roi)

        # 2. Use adaptive threshold with moderate block size
        thresh_roi = cv2.adaptiveThreshold(
            blurred_roi,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=25,
            C=4
        )
        if self.debug:
            cv2.imwrite(self._get_debug_path("03_thresh_roi", ".png"), thresh_roi)

        # 3. Moderate morphological operations
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
        min_bubble_w, max_bubble_w = 55, 75
        min_bubble_h, max_bubble_h = 60, 80
        min_bubble_ar, max_bubble_ar = 0.8, 1.2
        min_circularity = 0.7
        min_center_distance = 40  # Mínima distancia entre centros de burbujas

        # Detect all bubbles
        bubbles = []
        for i, cnt in enumerate(contours):
            try:
                x, y, w, h = cv2.boundingRect(cnt)
                area = cv2.contourArea(cnt)
                if area < 100: continue  # Skip very small contours

                ar = w / float(h)
                peri = cv2.arcLength(cnt, True)
                circularity = 4 * np.pi * (area / (peri**2)) if peri > 0 else 0
                
                # Check if it's a bubble
                is_bubble = (
                    min_bubble_w <= w <= max_bubble_w and
                    min_bubble_h <= h <= max_bubble_h and
                    min_bubble_ar <= ar <= max_bubble_ar and
                    circularity >= min_circularity
                )

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

        if self.debug:
            print(f"\nFound {len(rows)} rows")
            for i, row in enumerate(rows):
                print(f"Row {i+1}: {len(row)} elements")

            # Debug visualization for rows
            debug_rows = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
            colors = [(0,255,0), (255,0,0), (0,0,255), (255,255,0)]
            for row_idx, row in enumerate(rows):
                color = colors[row_idx % len(colors)]
                for bubble in row:
                    x, y, w, h = bubble['bounds']
                    cv2.rectangle(debug_rows, (x,y), (x+w,y+h), color, 2)
                    cv2.putText(debug_rows, f"R{row_idx+1}", (x,y-5), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                    # Draw center point and distance circle
                    center = (int(bubble['center_x']), int(bubble['center_y']))
                    cv2.circle(debug_rows, center, 2, (0,0,255), -1)
                    cv2.circle(debug_rows, center, min_center_distance//2, (0,255,255), 1)
            cv2.imwrite(self._get_debug_path("07_rows", ".png"), debug_rows)

        # Convert rows to questions
        questions = []
        for row_idx, row in enumerate(rows):
            question = {
                'question_number': row_idx + 1,
                'has_frame': False,
                'frame': None,
                'bubbles': row,
                'num_options': len(row)
            }
            
            # Process the question to find filled bubbles
            q_data = self._process_question(gray_roi, None, row)
            question.update(q_data)
            questions.append(question)

        return questions

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
            
            fill_ratios.append(fill_ratio)
            total_pixels_list.append(total_pixels)
            filled_pixels_list.append(filled_pixels)
        
        results['fill_ratios'] = [float(r) for r in fill_ratios]

        if fill_ratios:
            max_idx = np.argmax(fill_ratios)
            max_fill_ratio = fill_ratios[max_idx]
            
            sorted_ratios = sorted(fill_ratios, reverse=True)
            second_highest = sorted_ratios[1] if len(sorted_ratios) > 1 else 0
            
            if max_fill_ratio > 0.4 and (len(fill_ratios) == 1 or max_fill_ratio > second_highest * 1.2):
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
                        cv2.rectangle(debug_img, 
                                    (x + x_offset, y + y_offset),
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
                    color = (0, 255, 0)
                    if question.get('value') == letter:
                        color = (0, 0, 255)
                    try:
                        if contour is not None:
                            cnt = np.array(contour, dtype=np.int32)
                            cnt_offset = cnt + np.array([x_offset, y_offset])
                            cv2.drawContours(debug_img, [cnt_offset], -1, color, 2)
                        elif bounds:
                            x, y, w, h = map(int, bounds)
                            cv2.rectangle(debug_img, 
                                        (x + x_offset, y + y_offset),
                                        (x + w + x_offset, y + h + y_offset),
                                        color, 2)
                        if bounds:
                            x, y = map(int, bounds[:2])
                            fill_ratio = question.get('fill_ratios', [])[b_idx] if b_idx < len(question.get('fill_ratios', [])) else 0
                            cv2.putText(debug_img, f"{letter}:{fill_ratio:.2f}", 
                                      (x + x_offset, y + y_offset - 5),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
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

    def process_image(self, image_path: str) -> Dict[str, Any]:
        """Process the OMR image and return results."""
        try:
            original_image = cv2.imread(image_path)
            if original_image is None:
                return {"success": False, "error": f"Could not load image: {image_path}"}

            warped = self._extract_paper(original_image)
            if warped is None:
                warped = original_image
            self.warped_image = warped

            # QR detection - independent process
            raw_qr_data = self._extract_qr_data(warped)
            qr_output = raw_qr_data if raw_qr_data else ""

            # Bubble detection - independent process using full image
            questions_processed = self._detect_bubbles(warped)

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

            # Siempre generar la imagen con overlay de respuestas detectadas
            debug_image_path = self._get_debug_path(image_path, "questions_detected.jpeg")
            if len(warped.shape) == 3:
                gray_for_debug = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
            else:
                gray_for_debug = warped.copy()
            self._generate_debug_image(gray_for_debug, questions_processed, debug_image_path)

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