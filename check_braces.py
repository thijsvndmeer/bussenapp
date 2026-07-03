text = open('components/MetroBackground.tsx').read()
count = 0
for i, c in enumerate(text):
    if c == '{': count += 1
    elif c == '}': count -= 1
    if count < 0:
        print(f"Extra closing brace at char {i}")
        break
print(f"Final count: {count}")
