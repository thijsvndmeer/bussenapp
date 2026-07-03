import sys

def resolve(filename):
    with open(filename, 'r') as f:
        lines = f.read().split('\n')
    
    out = []
    i = 0
    in_base = False
    while i < len(lines):
        line = lines[i]
        if line.startswith('<<<<<<<'):
            i += 1
            continue
        elif line.startswith('|||||||'):
            in_base = True
            i += 1
            continue
        elif line.startswith('======='):
            in_base = False
            i += 1
            continue
        elif line.startswith('>>>>>>>'):
            i += 1
            continue
            
        if not in_base:
            out.append(line)
        i += 1
        
    with open(filename, 'w') as f:
        f.write('\n'.join(out))

for arg in sys.argv[1:]:
    resolve(arg)
