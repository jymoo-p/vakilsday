# eCourts Integration Setup

This directory contains Python scripts to integrate with Indian eCourts High Court services using the open-source `ecourts` library.

## Prerequisites

- Python 3.8 or higher
- pip3 (Python package manager)

## Installation

1. **Install the eCourts library:**

```bash
pip3 install ecourts
```

Or install from requirements.txt:

```bash
cd scripts/ecourts
pip3 install -r requirements.txt
```

2. **Verify installation:**

```bash
python3 -c "import ecourts; print('eCourts version:', ecourts.__version__)"
```

## Available Scripts

### 1. Get Cause List

Fetches the daily cause list for a specific High Court.

**Usage:**
```bash
python3 get_cause_list.py <state_code> <court_code> <date>
```

**Example:**
```bash
# Kerala High Court cause list for May 14, 2026
python3 get_cause_list.py KL 1 2026-05-14

# Madras High Court - Madurai Bench
python3 get_cause_list.py TN 2 2026-05-14
```

**Output:** JSON with case details including:
- Case number and type
- Petitioner and respondent names
- Advocates
- Judge, court number, item number
- Purpose of hearing

### 2. Get Available Courts

Lists all available High Courts and their benches.

**Usage:**
```bash
python3 get_courts.py
```

## State Codes

Common state codes (ISO 3166-2:IN):

- `AP` - Andhra Pradesh
- `DL` - Delhi
- `GJ` - Gujarat
- `KA` - Karnataka
- `KL` - Kerala
- `MH` - Maharashtra
- `RJ` - Rajasthan
- `TN` - Tamil Nadu
- `TS` - Telangana
- `UK` - Uttarakhand
- `WB` - West Bengal

## Court Codes

- `1` - Usually the principal bench
- `2` - Second bench (if exists)
- `3` - Third bench (if exists)

Examples:
- Karnataka High Court Principal Bench: `KA` + `1`
- Karnataka High Court Dharwad Bench: `KA` + `2`
- Madras High Court Chennai: `TN` + `1`
- Madras High Court Madurai: `TN` + `2`

## API Integration

These scripts are called from the Next.js API routes:

- **GET** `/api/ecourts/cause-list` - Fetch cause list
  - Query params: `email`, `stateCode`, `courtCode`, `date`
  
- **GET** `/api/ecourts/courts` - Get available courts list

- **GET** `/api/ecourts/setup-check` - Verify installation

## Troubleshooting

### "No module named 'ecourts'"

Install the library:
```bash
pip3 install ecourts
```

### Permission denied

Make scripts executable:
```bash
chmod +x get_cause_list.py get_courts.py
```

### Timeout errors

The eCourts website can be slow. The scripts have a 30-second timeout. If you get timeout errors:
- Try again later
- Check if the eCourts website is accessible
- Verify the state and court codes are correct

## Limitations

- **Only High Courts** - District courts not yet supported by the library
- **Single-threaded** - Intentionally slow to avoid overloading eCourts servers
- **No caching** - Each request fetches fresh data (can be slow)

## License

Uses the GPL3-licensed `ecourts` library from https://github.com/openjustice-in/ecourts
