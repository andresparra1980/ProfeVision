#!/usr/bin/env python3
"""
Standalone processor for OMR forms.
This script processes an OMR form image and outputs JSON results to stdout.
No debug images are saved, making it ideal for server-side processing.

Usage:
  python omr_standalone.py [image_path]

Example:
  python omr_standalone.py /path/to/image.jpg
"""

import sys
import json
import argparse
import cv2
import numpy as np
import os
from typing import Dict, Any, List, Optional, Tuple

class StandaloneOMRProcessor:
    """
    Standalone OMR processor that combines preprocessing, QR reading, and bubble detection.
    Designed to be used directly from command line with no debug output or file creation.
    """
    
    def __init__(self):
        """Initialize the standalone processor."""
        pass
        
    def process_image(self, image_path: str) -> Dict[str, Any]:
        """
        Process an OMR form image and return results.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with results
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "success": False,
                    "error": f"Could not load image from {image_path}"
                }
                
            # Step 1: Preprocess the image (extract paper, correct perspective)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            preprocessed_image, warped = self._preprocess_image(image)
            if warped is None:
                return {
                    "success": False,
                    "error": "Could not extract paper from background"
                }
                
            # Step 2: Extract QR code if present
            qr_data = self._extract_qr_code(warped)
                
            # Step 3: Detect and process bubbles
            questions = self._detect_bubbles(warped)
            
            # Step 4: Create simplified response
            answer_data = []
            for question in questions:
                if question.get('is_valid', False):
                    answer_data.append({
                        "number": question.get('question_number'),
                        "value": question.get('value'),
                        "confidence": question.get('confidence', 0.0),
                        "num_options": question.get('num_options', 0)
                    })
            
            # Return results
            return {
                "success": True,
                "qr_data": qr_data,
                "total_questions": len(questions),
                "answered_questions": len(answer_data),
                "answers": answer_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Preprocess the image to extract the paper and correct perspective.
        
        Args:
            image: Input image
            
        Returns:
            Tuple of preprocessed image and warped image
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding to get binary image
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Find the largest contour (presumed to be the paper)
        if not contours:
            return gray, None
            
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Approximate the contour to get a polygon
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # If the polygon doesn't have 4 points, it's not a proper rectangle
        # Try to find the 4 extreme points instead
        if len(approx) != 4:
            # Get the convex hull of the contour
            hull = cv2.convexHull(largest_contour)
            
            # Find the extreme points of the hull
            leftmost = tuple(hull[hull[:, :, 0].argmin()][0])
            rightmost = tuple(hull[hull[:, :, 0].argmax()][0])
            topmost = tuple(hull[hull[:, :, 1].argmin()][0])
            bottommost = tuple(hull[hull[:, :, 1].argmax()][0])
            
            # Define the points
            points = np.array([leftmost, topmost, rightmost, bottommost], dtype=np.float32)
            
            # Sort points to ensure they're in the correct order
            rect = self._order_points(points)
        else:
            # Use the approximated polygon points
            rect = self._order_points(approx.reshape(4, 2).astype(np.float32))
        
        # Get the dimensions of the warped image
        width_a = np.sqrt(((rect[1][0] - rect[0][0]) ** 2) + ((rect[1][1] - rect[0][1]) ** 2))
        width_b = np.sqrt(((rect[2][0] - rect[3][0]) ** 2) + ((rect[2][1] - rect[3][1]) ** 2))
        max_width = max(int(width_a), int(width_b))
        
        height_a = np.sqrt(((rect[0][0] - rect[3][0]) ** 2) + ((rect[0][1] - rect[3][1]) ** 2))
        height_b = np.sqrt(((rect[1][0] - rect[2][0]) ** 2) + ((rect[1][1] - rect[2][1]) ** 2))
        max_height = max(int(height_a), int(height_b))
        
        # Define destination points for perspective transform
        dst = np.array([
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1]
        ], dtype=np.float32)
        
        # Compute the perspective transform
        m = cv2.getPerspectiveTransform(rect, dst)
        
        # Apply the perspective transform
        warped = cv2.warpPerspective(image, m, (max_width, max_height))
        
        return gray, warped
        
    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """
        Order points in top-left, top-right, bottom-right, bottom-left order.
        
        Args:
            pts: Input points
            
        Returns:
            Ordered points
        """
        rect = np.zeros((4, 2), dtype=np.float32)
        
        # Sum of x+y coordinates
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # Top-left has smallest sum
        rect[2] = pts[np.argmax(s)]  # Bottom-right has largest sum
        
        # Difference of x-y coordinates
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # Top-right has smallest difference
        rect[3] = pts[np.argmax(diff)]  # Bottom-left has largest difference
        
        return rect
        
    def _extract_qr_code(self, image: np.ndarray) -> str:
        """
        Extract QR code data from image.
        
        Args:
            image: Input image
            
        Returns:
            QR code data as string
        """
        try:
            # Try to import pyzbar
            from pyzbar import pyzbar
        except ImportError:
            # Fall back to no QR code reading if pyzbar is not available
            return ""
            
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Look for the QR code in the top 20% of the image
        height, width = gray.shape[:2]
        top_region = gray[:int(height * 0.2), :]
        
        # Use pyzbar to decode QR codes
        qr_codes = pyzbar.decode(top_region)
        
        # If found, return the data from the first QR code
        if qr_codes:
            return qr_codes[0].data.decode('utf-8')
            
        return ""
        
    def _detect_bubbles(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect and process answer bubbles in the image.
        
        Args:
            image: Input image
            
        Returns:
            List of detected questions with answers
        """
        # Find the bubble region (excluding top area for QR code and bottom for instructions)
        bubble_region = self._find_bubble_region(image)
        
        # Extract the bubble region
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        y, h = bubble_region['y'], bubble_region['height']
        gray_roi = gray[y:y+h, :]
        
        # Preprocess the bubble region
        blurred = cv2.GaussianBlur(gray_roi, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        
        # Find contours
        contours_list = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours_list = contours_list[0] if len(contours_list) == 2 else contours_list[1]
        
        # Initialize containers for bubbles and frames
        bubbles = []
        frames = []
        
        # Filter contours to find bubbles and frames
        for i, c in enumerate(contours_list):
            x, y, w, h = cv2.boundingRect(c)
            ar = w / float(h)
            
            # Compute circularity
            area = cv2.contourArea(c)
            perimeter = cv2.arcLength(c, True)
            circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
            
            # Check if this looks like a square frame (for question numbers)
            is_frame = (0.8 <= ar <= 1.2) and (15 <= w <= 40) and (15 <= h <= 40) and (circularity > 0.7)
            
            # Check if this looks like a bubble (for answers)
            is_bubble = (0.7 <= ar <= 1.3) and (w >= 15) and (h >= 15) and (circularity > 0.5)
            
            if is_frame:
                frames.append({
                    'contour': c,
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'center_x': x + w/2,
                    'center_y': y + h/2,
                    'type': 'frame'
                })
            elif is_bubble:
                bubbles.append({
                    'contour': c,
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'center_x': x + w/2,
                    'center_y': y + h/2,
                    'type': 'bubble'
                })
        
        # Calculate mean bubble size for scaling
        if not bubbles:
            return []
            
        avg_bubble_width = np.mean([b['width'] for b in bubbles])
        avg_bubble_height = np.mean([b['height'] for b in bubbles])
        
        # Group elements by vertical position (rows)
        all_elements = bubbles + frames
        all_elements.sort(key=lambda e: e['center_y'])
        
        rows = []
        if all_elements:
            current_row = [all_elements[0]]
            row_y_tol = avg_bubble_height * 0.7  # Vertical tolerance: 70% of bubble height
            
            for i in range(1, len(all_elements)):
                if abs(all_elements[i]['center_y'] - current_row[0]['center_y']) < row_y_tol:
                    # Same row
                    current_row.append(all_elements[i])
                else:
                    # New row
                    rows.append(current_row)
                    current_row = [all_elements[i]]
                    
            # Add the last row
            if current_row:
                rows.append(current_row)
        
        # Identify midpoint of the form for column determination
        image_midpoint = gray_roi.shape[1] / 2
        
        # Process rows to identify question patterns
        questions = []
        
        for row_idx, row_elements in enumerate(rows):
            # Sort row elements by x-coordinate
            row_elements.sort(key=lambda e: e['center_x'])
            
            # Separate bubbles and frames in this row
            row_bubbles = [e for e in row_elements if e['type'] == 'bubble']
            row_frames = [e for e in row_elements if e['type'] == 'frame']
            
            # Method 1: Look for frame + bubble patterns
            if row_frames and row_bubbles:
                for frame in row_frames:
                    # Find bubbles to the right of this frame
                    options = []
                    for bubble in row_bubbles:
                        # Bubble must be to the right of frame
                        if bubble['center_x'] > frame['center_x'] + frame['width']:
                            # Check if bubble is approximately at the same height
                            if abs(bubble['center_y'] - frame['center_y']) < avg_bubble_height:
                                options.append(bubble)
                    
                    # Sort options by x-coordinate
                    options.sort(key=lambda b: b['center_x'])
                    
                    # Check if we have a valid group of options (2-5)
                    if 2 <= len(options) <= 5:
                        # Verify consistent spacing
                        x_diffs = [options[i+1]['center_x'] - options[i]['center_x'] for i in range(len(options)-1)]
                        avg_x_diff = sum(x_diffs) / len(x_diffs)
                        spacing_consistent = all(abs(d - avg_x_diff) < avg_x_diff * 0.6 for d in x_diffs)
                        
                        if spacing_consistent:
                            # Determine column based on frame position
                            is_right_column = frame['center_x'] > image_midpoint
                            
                            # Process this question
                            question = self._process_question(thresh, frame, options)
                            question['num_options'] = len(options)
                            question['has_frame'] = True
                            question['row'] = row_idx
                            question['column'] = 'right' if is_right_column else 'left'
                            questions.append(question)
            
            # Method 2: Look for just bubble patterns without frames
            if len(row_bubbles) >= 2:  # At least 2 options
                # Group bubbles into potential question patterns
                i = 0
                while i < len(row_bubbles):
                    # Try to find 2-5 consecutive bubbles with consistent spacing
                    options_count = 0
                    options = []
                    x_diffs = []
                    
                    while i + options_count < len(row_bubbles) and options_count < 5:  # Maximum of 5 options
                        # Check for too much distance
                        if options_count > 0 and (row_bubbles[i + options_count]['center_x'] - options[-1]['center_x'] > avg_bubble_width * 3):
                            break
                            
                        options.append(row_bubbles[i + options_count])
                        if len(options) > 1:
                            x_diffs.append(options[-1]['center_x'] - options[-2]['center_x'])
                        
                        options_count += 1
                    
                    # Check if we have a valid group of options (2-5)
                    if 2 <= options_count <= 5 and x_diffs:
                        avg_x_diff = sum(x_diffs) / len(x_diffs)
                        spacing_consistent = all(abs(d - avg_x_diff) < avg_x_diff * 0.6 for d in x_diffs)
                        
                        # Check for a nearby frame (to the left of the options)
                        associated_frame = None
                        for frame in row_frames:
                            if frame['center_x'] < options[0]['center_x'] and abs(frame['center_y'] - options[0]['center_y']) < avg_bubble_height:
                                # Frame must be reasonably close horizontally
                                if options[0]['center_x'] - frame['center_x'] < avg_bubble_width * 4:
                                    associated_frame = frame
                                    break
                        
                        # Additional checks for irregular options distribution
                        irregular_spacing = False
                        if options_count == 2:
                            # For 2 bubbles, check they are not too far right in the image
                            leftmost_x = options[0]['center_x']
                            if leftmost_x > gray_roi.shape[1] * 0.6:  # If leftmost bubble is past 60% of image width
                                irregular_spacing = True
                        
                        if spacing_consistent and not irregular_spacing:
                            # Determine column
                            is_right_column = options[0]['center_x'] > image_midpoint
                            
                            # Process this question
                            question = self._process_question(thresh, associated_frame, options)
                            question['num_options'] = options_count
                            question['has_frame'] = bool(associated_frame)
                            question['row'] = row_idx
                            question['column'] = 'right' if is_right_column else 'left'
                            questions.append(question)
                            
                            i += options_count  # Move past this question
                            continue
                    
                    # If we're here, no valid question was found at this position
                    i += 1
        
        # Group questions by column for correct numbering
        left_column = [q for q in questions if q.get('column') == 'left']
        right_column = [q for q in questions if q.get('column') == 'right']
        
        # Sort questions within each column by vertical position (row)
        left_column.sort(key=lambda q: q['row'])
        right_column.sort(key=lambda q: q['row'])
        
        # Assign question numbers: 1-10 for left column, 11+ for right column
        for i, q in enumerate(left_column):
            q['question_number'] = i + 1
            
        for i, q in enumerate(right_column):
            q['question_number'] = i + len(left_column) + 1
            
        # Combine columns back for output
        numbered_questions = left_column + right_column
        
        # Sort by question number
        numbered_questions.sort(key=lambda q: q['question_number'])
        
        return numbered_questions
            
    def _find_bubble_region(self, image: np.ndarray) -> Dict[str, int]:
        """
        Find the region containing answer bubbles in the image.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary with region information
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        # Get dimensions
        height, width = gray.shape
        
        # Exclude both top (QR code, title) and bottom (instructions) areas
        top_margin = int(height * 0.16)     # Exclude top 16%
        bottom_margin = int(height * 0.1)   # Exclude bottom 10%
        
        # Get the main form area
        roi_y = top_margin
        roi_height = height - top_margin - bottom_margin
        
        # Create the bubble region
        return {
            'x': 0,              # Start from the left edge
            'y': roi_y,          # Start after top margin
            'width': width,      # Use full width
            'height': roi_height # Use height excluding top and bottom margins
        }
    
    def _get_option_letter(self, index: int) -> str:
        """
        Convert bubble index to option letter using the mapping:
        0 -> 'X', 1 -> 'A', 2 -> 'B', 3 -> 'C', 4 -> 'D'
        
        Args:
            index: Bubble index
            
        Returns:
            Option letter
        """
        if index == 0:
            return 'X'
        else:
            return chr(64 + index)  # 'A' starts at 65 in ASCII, so 64+1=A, 64+2=B, etc.
    
    def _process_question(self, thresh: np.ndarray, frame: Optional[Dict[str, Any]], options: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process a question to determine which answer is marked.
        
        Args:
            thresh: Thresholded image
            frame: Frame information (can be None)
            options: List of bubble information
            
        Returns:
            Dictionary with question information
        """
        # Initialize variables
        answer = None
        fill_ratios = []
        is_valid = False
        max_fill_ratio = 0.0
        
        # Check each bubble
        for j, c in enumerate(options):
            # Extract bounds
            x, y, w, h = c['x'], c['y'], c['width'], c['height']
            
            # Create a mask for this bubble (focusing on the inner part)
            mask = np.zeros(thresh.shape, dtype="uint8")
            center = (int(x + w/2), int(y + h/2))
            radius = int(min(w, h) * 0.4)  # Use 40% of the bubble's smallest dimension
            cv2.circle(mask, center, radius, 255, -1)
            
            # Apply the mask to the thresholded image
            bubble_region = cv2.bitwise_and(thresh, thresh, mask=mask)
            
            # Calculate the percentage of white pixels in the bubble region
            total_pixels = cv2.countNonZero(mask)
            white_pixels = cv2.countNonZero(bubble_region)
            
            # Calculate fill ratio (higher ratio = more filled in original image)
            fill_ratio = white_pixels / total_pixels if total_pixels > 0 else 0
            fill_ratios.append(fill_ratio)
        
        # Analyze the fill ratios to determine the answer
        if fill_ratios:
            # Find the bubble with the highest fill ratio
            max_idx = fill_ratios.index(max(fill_ratios))
            max_fill_ratio = fill_ratios[max_idx]
            
            # Find the second highest fill ratio
            sorted_ratios = sorted(fill_ratios, reverse=True)
            second_highest = sorted_ratios[1] if len(sorted_ratios) > 1 else 0
            
            # Criteria for a valid answer
            if max_fill_ratio > 0.4:  # Minimum threshold to consider it filled
                if len(fill_ratios) == 1 or max_fill_ratio > second_highest * 1.2:
                    # Valid answer: above threshold and significantly higher than others
                    answer = self._get_option_letter(max_idx)
                    is_valid = True
        
        # Prepare the question data
        question_data = {
            'value': answer if is_valid else None,
            'confidence': float(max_fill_ratio) if is_valid else 0.0,
            'is_valid': is_valid,
            'fill_ratios': [float(r) for r in fill_ratios]
        }
        
        # Add frame info if available
        if frame is not None:
            question_data['frame'] = True
            
        return question_data

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Process an OMR form image and output JSON to stdout.')
    parser.add_argument('image_path', help='Path to the image file')
    args = parser.parse_args()
    
    # Create processor and process the image
    processor = StandaloneOMRProcessor()
    results = processor.process_image(args.image_path)
    
    # Output JSON to stdout
    print(json.dumps(results, indent=None))

if __name__ == '__main__':
    main() 