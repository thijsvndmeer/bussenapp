text = open('components/MetroBackground.tsx').read()
lines = text.split('\n')
count = 0
for i, line in enumerate(lines):
    count += line.count('{')
    count -= line.count('}')
    print(f"{i+1:3d} [{count:2d}] {line[:60]}")
