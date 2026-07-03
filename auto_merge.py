import sys
def resolve(filename):
    lines = open(filename).read().split('\n')
    out = []
    i = 0
    in_conflict = False
    while i < len(lines):
        line = lines[i]
        if line.startswith('<<<<<<<'):
            i += 1
            continue
        if line.startswith('|||||||'):
            while i < len(lines) and not lines[i].startswith('======='):
                i += 1
            i += 1
            continue
        if line.startswith('======='):
            i += 1
            continue
        if line.startswith('>>>>>>>'):
            i += 1
            continue
        out.append(line)
        i += 1
    open(filename, 'w').write('\n'.join(out))

for arg in sys.argv[1:]:
    resolve(arg)
