import os
import re

file_path = os.path.join(os.path.dirname(__file__), '..', 'App.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace React import to include Suspense
content = re.sub(r'import React, {([^}]*)} from \'react\';', 
                 lambda m: f"import React, {{{m.group(1).replace(', Suspense', '')}, Suspense}} from 'react';", 
                 content)

# Replace SettingsPanel
content = re.sub(r'import SettingsPanel from \'\./components/SettingsPanel\';',
                 r'const SettingsPanel = React.lazy(() => import(\'./components/SettingsPanel\'));',
                 content)

# Replace Modals
modals = [
    'QuitConfirmModal', 'ColorPickerModal',
    'PhotoOptionsModal', 'PatchNotesModal', 'HardBusWarningModal',
    'AdLoadingModal', 'SlideMenuModal', 'PyramidMatchModal'
]

for modal in modals:
    pattern = r'import \{ ' + modal + r' \} from \'\./components/modals/' + modal + r'\';'
    replacement = f"const {modal} = React.lazy(() => import('./components/modals/{modal}').then(m => ({{ default: m.{modal} }})));"
    content = re.sub(pattern, replacement, content)

# Export App with Suspense wrapper
content = re.sub(r'export default App;\s*$', 
                 r'export default function AppWrapper() { return <Suspense fallback={null}><App /></Suspense>; }\n', 
                 content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Lazy loading implemented!")
