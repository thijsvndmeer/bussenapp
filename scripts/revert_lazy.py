import os
import re

file_path = os.path.join(os.path.dirname(__file__), '..', 'App.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Suspense from imports if unused elsewhere
content = content.replace("import React, { useState, useRef, useEffect, useCallback, useMemo , Suspense} from 'react';", "import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';")

# 2. Revert the AppWrapper hack at the bottom
content = content.replace("export default function AppWrapper() { return <Suspense fallback={null}><App /></Suspense>; }", "export default App;")

# 3. Revert lazy imports back to synchronous imports
content = re.sub(r"const SettingsPanel = React\.lazy\(\(\) => import\('\./components/SettingsPanel'\)\);", "import SettingsPanel from './components/SettingsPanel';", content)
content = re.sub(r"const QuitConfirmModal = React\.lazy\(\(\) => import\('\./components/modals/QuitConfirmModal'\)\.then\(m => \(\{ default: m\.QuitConfirmModal \}\)\)\);", "import { QuitConfirmModal } from './components/modals/QuitConfirmModal';", content)
content = re.sub(r"const ColorPickerModal = React\.lazy\(\(\) => import\('\./components/modals/ColorPickerModal'\)\.then\(m => \(\{ default: m\.ColorPickerModal \}\)\)\);", "import { ColorPickerModal } from './components/modals/ColorPickerModal';", content)
content = re.sub(r"const PhotoOptionsModal = React\.lazy\(\(\) => import\('\./components/modals/PhotoOptionsModal'\)\.then\(m => \(\{ default: m\.PhotoOptionsModal \}\)\)\);", "import { PhotoOptionsModal } from './components/modals/PhotoOptionsModal';", content)
content = re.sub(r"const PatchNotesModal = React\.lazy\(\(\) => import\('\./components/modals/PatchNotesModal'\)\.then\(m => \(\{ default: m\.PatchNotesModal \}\)\)\);", "import { PatchNotesModal } from './components/modals/PatchNotesModal';", content)
content = re.sub(r"const HardBusWarningModal = React\.lazy\(\(\) => import\('\./components/modals/HardBusWarningModal'\)\.then\(m => \(\{ default: m\.HardBusWarningModal \}\)\)\);", "import { HardBusWarningModal } from './components/modals/HardBusWarningModal';", content)
content = re.sub(r"const AdLoadingModal = React\.lazy\(\(\) => import\('\./components/modals/AdLoadingModal'\)\.then\(m => \(\{ default: m\.AdLoadingModal \}\)\)\);", "import { AdLoadingModal } from './components/modals/AdLoadingModal';", content)
content = re.sub(r"const SlideMenuModal = React\.lazy\(\(\) => import\('\./components/modals/SlideMenuModal'\)\.then\(m => \(\{ default: m\.SlideMenuModal \}\)\)\);", "import { SlideMenuModal } from './components/modals/SlideMenuModal';", content)
content = re.sub(r"const PyramidMatchModal = React\.lazy\(\(\) => import\('\./components/modals/PyramidMatchModal'\)\.then\(m => \(\{ default: m\.PyramidMatchModal \}\)\)\);", "import { PyramidMatchModal } from './components/modals/PyramidMatchModal';", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Lazy loading reverted to fix black screen bug!")
