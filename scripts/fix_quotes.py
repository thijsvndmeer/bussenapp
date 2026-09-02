import os

file_path = os.path.join(os.path.dirname(__file__), '..', 'App.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the escaped quotes from earlier python scripts
content = content.replace("import(\\'.", "import('.")
content = content.replace("\\')", "')")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Quotes fixed!")
