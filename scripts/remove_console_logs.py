import os
import re

file_path = os.path.join(os.path.dirname(__file__), '..', 'App.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all console.log statements
# This regex handles basic console.log and console.error, console.warn.
# We will match `console\.(log|warn|error|info)\(.*\);` roughly.
# Wait, let's just match `console\.log\(.*?\);` across single lines.
new_content = re.sub(r'^[ \t]*console\.(log|warn|error|info)\(.*\);?[ \t]*\n', '', content, flags=re.MULTILINE)
new_content = re.sub(r'console\.(log|warn|error|info)\(.*\);?', '', new_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Removed console logs!")
