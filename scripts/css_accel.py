import os
import re

file_path = os.path.join(os.path.dirname(__file__), '..', 'styles', 'animations.css')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace translateY with translate3d for GPU acceleration
content = re.sub(r'translateY\((.*?)\)', r'translate3d(0, \1, 0)', content)
# Replace translateX with translate3d
content = re.sub(r'translateX\((.*?)\)', r'translate3d(\1, 0, 0)', content)
# Replace translate(x, y) with translate3d
content = re.sub(r'translate\((.*?), (.*?)\)', r'translate3d(\1, \2, 0)', content)

# Add will-change to all animation classes
# Find lines with `.animate-.* {`
content = re.sub(r'(\.animate-[a-zA-Z0-9-]+\s*\{[^}]*?)animation:', 
                 r'\1will-change: transform, opacity;\n  animation:', 
                 content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Animations accelerated!")
