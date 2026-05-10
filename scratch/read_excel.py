
import os
import zipfile
import xml.etree.ElementTree as ET

def read_xlsx_basic(filepath):
    """Read XLSX without pandas/openpyxl by parsing the XML directly."""
    try:
        with zipfile.ZipFile(filepath, 'r') as zip_ref:
            # Shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    for node in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        shared_strings.append(node.text)
            
            # Read first sheet
            with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                
                rows = []
                for row_node in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                    row_data = []
                    for c_node in row_node.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        v_node = c_node.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        if v_node is not None:
                            value = v_node.text
                            t = c_node.get('t')
                            if t == 's':
                                value = shared_strings[int(value)]
                            row_data.append(value)
                    rows.append(", ".join(row_data))
                return rows
    except Exception as e:
        return [f"Error reading {filepath}: {str(e)}"]

downloads_path = "/home/shaolin/Downloads"
files = [f for f in os.listdir(downloads_path) if f.endswith('.xlsx')]

print(f"Found {len(files)} Excel files.")
for file in files[:3]: # Let's peek at the first 3
    print(f"\n--- {file} ---")
    data = read_xlsx_basic(os.path.join(downloads_path, file))
    for row in data[:5]: # Show first 5 rows
        print(row)
