#!/usr/bin/env python3
"""
Script to fetch cause list from eCourts India High Courts
Usage: python get_cause_list.py <state_code> <court_code> <date>
Example: python get_cause_list.py KL 1 2024-05-14
"""

import sys
import json
from datetime import datetime
from ecourts import ECourt

def get_cause_list(state_code, court_code, date_str):
    """
    Fetch cause list for a specific court and date

    Args:
        state_code: ISO state code (e.g., 'KL' for Kerala, 'TN' for Tamil Nadu)
        court_code: Court identifier (e.g., '1' for principal bench)
        date_str: Date in YYYY-MM-DD format

    Returns:
        JSON string with cause list data
    """
    try:
        # Parse date
        date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # Initialize eCourt connection
        ecourt = ECourt(state_code=state_code, court_code=court_code)

        # Fetch cause list
        cause_list = ecourt.get_cause_list(date=date)

        # Convert to JSON-serializable format
        result = {
            "success": True,
            "state_code": state_code,
            "court_code": court_code,
            "date": date_str,
            "cases": []
        }

        # Process cause list entries
        for entry in cause_list:
            case_data = {
                "case_number": getattr(entry, 'case_number', None),
                "case_type": getattr(entry, 'case_type', None),
                "petitioner": getattr(entry, 'petitioner', None),
                "respondent": getattr(entry, 'respondent', None),
                "advocate_petitioner": getattr(entry, 'advocate_petitioner', None),
                "advocate_respondent": getattr(entry, 'advocate_respondent', None),
                "judge": getattr(entry, 'judge', None),
                "court_number": getattr(entry, 'court_number', None),
                "item_number": getattr(entry, 'item_number', None),
                "purpose": getattr(entry, 'purpose', None),
            }
            result["cases"].append(case_data)

        return json.dumps(result, indent=2)

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
        return json.dumps(error_result, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python get_cause_list.py <state_code> <court_code> <date>",
            "example": "python get_cause_list.py KL 1 2024-05-14"
        }))
        sys.exit(1)

    state_code = sys.argv[1]
    court_code = sys.argv[2]
    date_str = sys.argv[3]

    result = get_cause_list(state_code, court_code, date_str)
    print(result)
