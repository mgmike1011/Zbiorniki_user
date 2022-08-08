SHELL := cmd.exe
CYGWIN=nontsec
export PATH := C:\epsonrc70\vision\install\gige\Runtime\Win32\;C:\epsonrc70\vision\install\gige\Runtime\x64\;C:\Program Files\Common Files\Oracle\Java\javapath;C:\Program Files (x86)\Common Files\Oracle\Java\javapath;C:\Program Files (x86)\Intel\Intel(R) Management Engine Components\iCLS\;C:\Program Files\Intel\Intel(R) Management Engine Components\iCLS\;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Program Files (x86)\Intel\Intel(R) Management Engine Components\DAL;C:\Program Files\Intel\Intel(R) Management Engine Components\DAL;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Program Files\Intel\WiFi\bin\;C:\Program Files\Common Files\Intel\WirelessCommon\;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\Program Files\NVIDIA Corporation\NVIDIA NvDLISR;C:\Program Files\Microsoft SQL Server\110\Tools\Binn\;C:\Program Files\Microsoft SQL Server\120\Tools\Binn\;C:\Program Files\MATLAB\R2019b\bin;C:\Program Files (x86)\IVI Foundation\IVI\bin;C:\Program Files\IVI Foundation\IVI\bin;C:\Program Files (x86)\IVI Foundation\VISA\WinNT\Bin\;C:\Program Files\IVI Foundation\VISA\Win64\Bin\;C:\Program Files (x86)\IVI Foundation\VISA\WinNT\Bin;C:\Program Files\Git\cmd;C:\Users\mgmil\AppData\Local\Microsoft\WindowsApps;C:\Users\mgmil\AppData\Local\GitHubDesktop\bin;C:\Users\mgmil\AppData\Local\Microsoft\WindowsApps;C:\Users\mgmil\AppData\Local\Programs\Microsoft VS Code\bin;C:\Program Files (x86)\Common Files\Hilscher GmbH\TLRDecode;C:\Users\mgmil\AppData\Local\Microsoft\WindowsApps;C:\Users\mgmil\AppData\Local\GitHubDesktop\bin;C:\Users\mgmil\AppData\Local\Microsoft\WindowsApps;C:\Users\mgmil\AppData\Local\Programs\Microsoft VS Code\bin;C:\Program Files (x86)\Common Files\Hilscher GmbH\TLRDecode;C:\BRAutomation\AS411\bin-en\4.11;C:\BRAutomation\AS411\bin-en\4.10;C:\BRAutomation\AS411\bin-en\4.9;C:\BRAutomation\AS411\bin-en\4.8;C:\BRAutomation\AS411\bin-en\4.7;C:\BRAutomation\AS411\bin-en\4.6;C:\BRAutomation\AS411\bin-en\4.5;C:\BRAutomation\AS411\bin-en\4.4;C:\BRAutomation\AS411\bin-en\4.3;C:\BRAutomation\AS411\bin-en\4.2;C:\BRAutomation\AS411\bin-en\4.1;C:\BRAutomation\AS411\bin-en\4.0;C:\BRAutomation\AS411\bin-en
export AS_BUILD_MODE := BuildAndTransfer
export AS_VERSION := 4.11.2.75
export AS_WORKINGVERSION := 4.11
export AS_COMPANY_NAME :=  
export AS_USER_NAME := mgmil
export AS_PATH := C:/BRAutomation/AS411
export AS_BIN_PATH := C:/BRAutomation/AS411/bin-en
export AS_PROJECT_PATH := D:/BuR/Projekt_indywidualny_/Zbiorniki_user
export AS_PROJECT_NAME := CaseWeek_user
export AS_SYSTEM_PATH := C:/BRAutomation/AS/System
export AS_VC_PATH := C:/BRAutomation/AS411/AS/VC
export AS_TEMP_PATH := D:/BuR/Projekt_indywidualny_/Zbiorniki_user/Temp
export AS_CONFIGURATION := X20CP1584
export AS_BINARIES_PATH := D:/BuR/Projekt_indywidualny_/Zbiorniki_user/Binaries
export AS_GNU_INST_PATH := C:/BRAutomation/AS411/AS/GnuInst/V4.1.2
export AS_GNU_BIN_PATH := C:/BRAutomation/AS411/AS/GnuInst/V4.1.2/4.9/bin
export AS_GNU_INST_PATH_SUB_MAKE := C:/BRAutomation/AS411/AS/GnuInst/V4.1.2
export AS_GNU_BIN_PATH_SUB_MAKE := C:/BRAutomation/AS411/AS/GnuInst/V4.1.2/4.9/bin
export AS_INSTALL_PATH := C:/BRAutomation/AS411
export WIN32_AS_PATH := "C:\BRAutomation\AS411"
export WIN32_AS_BIN_PATH := "C:\BRAutomation\AS411\bin-en"
export WIN32_AS_PROJECT_PATH := "D:\BuR\Projekt_indywidualny_\Zbiorniki_user"
export WIN32_AS_SYSTEM_PATH := "C:\BRAutomation\AS\System"
export WIN32_AS_VC_PATH := "C:\BRAutomation\AS411\AS\VC"
export WIN32_AS_TEMP_PATH := "D:\BuR\Projekt_indywidualny_\Zbiorniki_user\Temp"
export WIN32_AS_BINARIES_PATH := "D:\BuR\Projekt_indywidualny_\Zbiorniki_user\Binaries"
export WIN32_AS_GNU_INST_PATH := "C:\BRAutomation\AS411\AS\GnuInst\V4.1.2"
export WIN32_AS_GNU_BIN_PATH := "$(WIN32_AS_GNU_INST_PATH)\\bin" 
export WIN32_AS_INSTALL_PATH := "C:\BRAutomation\AS411"

.suffixes:

ProjectMakeFile:

	@'$(AS_BIN_PATH)/4.9/BR.AS.AnalyseProject.exe' '$(AS_PROJECT_PATH)/CaseWeek_user.apj' -t '$(AS_TEMP_PATH)' -c '$(AS_CONFIGURATION)' -o '$(AS_BINARIES_PATH)'   -sfas -buildMode 'BuildAndTransfer'   

