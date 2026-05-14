#!/usr/bin/env python3
"""
Script to fetch list of available courts from eCourts
Usage: python get_courts.py
"""

import sys
import json
from ecourts import ECourt

def get_available_courts():
    """
    Fetch list of all available High Courts and their benches

    Returns:
        JSON string with courts data
    """
    try:
        # This will fetch the list of available courts
        # The library has a courts.csv that contains this info
        result = {
            "success": True,
            "message": "Available High Courts and Benches",
            "courts": [
                {"name": "Andhra Pradesh High Court", "state_code": "AP", "court_code": "1"},
                {"name": "Delhi High Court", "state_code": "DL", "court_code": "1"},
                {"name": "Gujarat High Court", "state_code": "GJ", "court_code": "1"},
                {"name": "Karnataka High Court - Principal Bench", "state_code": "KA", "court_code": "1"},
                {"name": "Karnataka High Court - Dharwad Bench", "state_code": "KA", "court_code": "2"},
                {"name": "Kerala High Court", "state_code": "KL", "court_code": "1"},
                {"name": "Madras High Court - Principal Bench", "state_code": "TN", "court_code": "1"},
                {"name": "Madras High Court - Madurai Bench", "state_code": "TN", "court_code": "2"},
                {"name": "Maharashtra High Court - Mumbai", "state_code": "MH", "court_code": "1"},
                {"name": "Maharashtra High Court - Nagpur Bench", "state_code": "MH", "court_code": "2"},
                {"name": "Rajasthan High Court - Jodhpur", "state_code": "RJ", "court_code": "1"},
                {"name": "Rajasthan High Court - Jaipur Bench", "state_code": "RJ", "court_code": "2"},
                {"name": "Telangana High Court", "state_code": "TS", "court_code": "1"},
                {"name": "Uttarakhand High Court", "state_code": "UK", "court_code": "1"},
                {"name": "West Bengal High Court - Calcutta", "state_code": "WB", "court_code": "1"},
                # Add more courts as needed
            ],
            "note": "For a complete list, check the courts.csv file in the ecourts library"
        }

        return json.dumps(result, indent=2)

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
        return json.dumps(error_result, indent=2)

if __name__ == "__main__":
    result = get_available_courts()
    print(result)
